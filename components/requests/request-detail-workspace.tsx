"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { RequestActivity } from "@/types/activity";
import type { AssigneeOption } from "@/types/profile";
import type { Request, RequestNote, RequestPriority, RequestStatus } from "@/types/request";
import { activityTypeLabel, priorityLabel, statusLabel } from "@/lib/labels";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  nowIso,
  toDatetimeLocalValue,
} from "@/lib/date";
import { cn } from "@/lib/cn";
import {
  uiBtnGhost,
  uiBtnIcon,
  uiBtnPrimary,
  uiBtnSecondary,
  uiControl,
  uiTransition,
} from "@/lib/ui-classes";
import {
  uiFilterLabel,
  uiOverline,
  uiPageLead,
  uiPageTitleDetail,
  uiSectionHeading,
} from "@/lib/typography";
import { createRequestNote } from "@/lib/actions/create-request-note";
import { updateRequestAssignment } from "@/lib/actions/update-request-assignment";
import { updateRequestDetails } from "@/lib/actions/update-request-details";
import { updateRequestOperational } from "@/lib/actions/update-request-operational";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { Panel } from "@/components/ui/panel";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { StatusBadge } from "@/components/requests/status-badge";
import { PriorityBadge } from "@/components/requests/priority-badge";

const NOTE_COMPOSER_PLACEHOLDER =
  "Aggiungi una nota operativa, aggiornamento o follow-up…";

const STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const PRIORITIES: RequestPriority[] = ["high", "medium", "low"];

const controlClass = cn(uiControl, "px-2.5 py-2.5");
const inputClass = uiControl;

type Props = {
  initialRequest: Request;
  initialNotes: RequestNote[];
  initialActivities: RequestActivity[];
  /** Admin e manager possono riassegnare. */
  canAssignRequests: boolean;
  assigneeOptions: AssigneeOption[];
};

/**
 * Dettaglio: lettura da Supabase; operativi e note salvati su Supabase.
 */
export function RequestDetailWorkspace({
  initialRequest,
  initialNotes,
  initialActivities,
  canAssignRequests,
  assigneeOptions,
}: Props) {
  const router = useRouter();
  const [request, setRequest] = useState<Request>(initialRequest);
  const [notes, setNotes] = useState<RequestNote[]>(initialNotes);
  const [activities, setActivities] =
    useState<RequestActivity[]>(initialActivities);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentErr, setAssignmentErr] = useState<string | null>(null);
  const [composerBody, setComposerBody] = useState("");
  const { pulseTopBar } = useDetailSaveFeedback();
  const [nextSaveUi, setNextSaveUi] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [noteSaveUi, setNoteSaveUi] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [operationalError, setOperationalError] = useState<string | null>(null);
  const [opBusy, setOpBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const nextSaveResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const noteSaveResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const [nextDraft, setNextDraft] = useState(initialRequest.nextAction);
  const [nextAtDraft, setNextAtDraft] = useState(
    toDatetimeLocalValue(initialRequest.nextActionAt)
  );

  useEffect(() => {
    // Allinea allo stato server dopo refresh o navigazione (stesso id, props aggiornate).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync esplicito da RSC
    setNotes(initialNotes);
  }, [initialRequest.id, initialNotes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync esplicito da RSC
    setActivities(initialActivities);
  }, [initialRequest.id, initialActivities]);

  const showFeedback = useCallback(() => {
    pulseTopBar();
  }, [pulseTopBar]);

  useEffect(
    () => () => {
      if (nextSaveResetRef.current) clearTimeout(nextSaveResetRef.current);
      if (noteSaveResetRef.current) clearTimeout(noteSaveResetRef.current);
    },
    []
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [initialRequest.id]);

  const patchRequest = useCallback((patch: Partial<Request>) => {
    setRequest((prev) => {
      const next = { ...prev, ...patch };
      return {
        ...next,
        updatedAt:
          patch.updatedAt !== undefined ? patch.updatedAt : nowIso(),
      };
    });
  }, []);

  const nextDirty = useMemo(
    () =>
      nextDraft !== request.nextAction ||
      toDatetimeLocalValue(request.nextActionAt) !== nextAtDraft,
    [nextDraft, request.nextAction, request.nextActionAt, nextAtDraft]
  );

  const onStatus = useCallback(
    async (status: RequestStatus) => {
      const prev = request.status;
      setOperationalError(null);
      patchRequest({ status });
      setOpBusy(true);
      const res = await updateRequestOperational(request.id, { status });
      setOpBusy(false);
      if (!res.ok) {
        patchRequest({ status: prev });
        setOperationalError(res.message);
        return;
      }
      patchRequest({
        updatedAt: res.updatedAt,
      });
      showFeedback();
      router.refresh();
    },
    [patchRequest, request.status, request.id, showFeedback, router]
  );

  const onPriority = useCallback(
    async (priority: RequestPriority) => {
      const prev = request.priority;
      setOperationalError(null);
      patchRequest({ priority });
      setOpBusy(true);
      const res = await updateRequestOperational(request.id, { priority });
      setOpBusy(false);
      if (!res.ok) {
        patchRequest({ priority: prev });
        setOperationalError(res.message);
        return;
      }
      patchRequest({
        updatedAt: res.updatedAt,
      });
      showFeedback();
      router.refresh();
    },
    [patchRequest, request.priority, request.id, showFeedback, router]
  );

  const onAssignmentChange = useCallback(
    async (raw: string) => {
      if (!canAssignRequests || assignmentBusy) return;
      const nextId = raw === "" ? null : raw;
      setAssignmentBusy(true);
      setAssignmentErr(null);
      const res = await updateRequestAssignment(request.id, nextId);
      setAssignmentBusy(false);
      if (!res.ok) {
        setAssignmentErr(res.message);
        return;
      }
      const label =
        res.assignedUserId === null
          ? null
          : assigneeOptions.find((x) => x.userId === res.assignedUserId)?.label ??
            request.assignedToLabel ??
            null;
      patchRequest({
        assignedUserId: res.assignedUserId,
        assignedAt: res.assignedAt,
        assignedToLabel: label,
      });
      showFeedback();
      router.refresh();
    },
    [
      canAssignRequests,
      assignmentBusy,
      request.id,
      request.assignedToLabel,
      assigneeOptions,
      patchRequest,
      showFeedback,
      router,
    ],
  );

  const saveNextAction = useCallback(async () => {
    if (!nextDirty || nextSaveUi === "saving") return;
    setOperationalError(null);
    setNextSaveUi("saving");
    const nextAt = fromDatetimeLocalValue(nextAtDraft);
    const res = await updateRequestOperational(request.id, {
      next_action: nextDraft,
      next_action_at: nextAt,
      bump_last_interaction: true,
    });
    if (!res.ok) {
      setNextSaveUi("idle");
      setOperationalError(res.message);
      return;
    }
    patchRequest({
      nextAction: nextDraft,
      nextActionAt: nextAt,
      updatedAt: res.updatedAt,
      lastInteractionAt: res.lastInteractionAt,
    });
    setNextAtDraft(toDatetimeLocalValue(nextAt));
    setNextSaveUi("saved");
    showFeedback();
    if (nextSaveResetRef.current) clearTimeout(nextSaveResetRef.current);
    nextSaveResetRef.current = setTimeout(() => {
      setNextSaveUi("idle");
      nextSaveResetRef.current = undefined;
    }, 2000);
    router.refresh();
  }, [
    nextAtDraft,
    nextDraft,
    nextDirty,
    nextSaveUi,
    patchRequest,
    request.id,
    showFeedback,
    router,
  ]);

  const saveDetails = useCallback(
    async (patch: Pick<
      Request,
      | "title"
      | "companyName"
      | "contactName"
      | "contactEmail"
      | "source"
      | "description"
    >) => {
      setDetailError(null);
      setDetailSaving(true);
      const res = await updateRequestDetails(request.id, patch);
      setDetailSaving(false);
      if (!res.ok) {
        setDetailError(res.message);
        return;
      }
      patchRequest({ ...patch, updatedAt: res.updatedAt });
      setEditOpen(false);
      showFeedback();
    },
    [patchRequest, request.id, showFeedback]
  );

  const submitNote = useCallback(async () => {
    const trimmed = composerBody.trim();
    if (!trimmed || noteSaveUi === "saving") return;
    setNoteError(null);
    setNoteSaveUi("saving");
    const res = await createRequestNote(request.id, trimmed);
    if (!res.ok) {
      setNoteSaveUi("idle");
      setNoteError(res.message);
      return;
    }
    setNotes((prev) => [res.note, ...prev]);
    setComposerBody("");
    patchRequest({
      lastInteractionAt: res.lastInteractionAt,
      updatedAt: res.updatedAt,
    });
    setNoteSaveUi("saved");
    showFeedback();
    if (noteSaveResetRef.current) clearTimeout(noteSaveResetRef.current);
    noteSaveResetRef.current = setTimeout(() => {
      setNoteSaveUi("idle");
      noteSaveResetRef.current = undefined;
    }, 2000);
    router.refresh();
  }, [composerBody, noteSaveUi, patchRequest, request.id, showFeedback, router]);

  const clearComposer = useCallback(() => {
    setComposerBody("");
  }, []);

  const readOnlyFields = useMemo(
    () => [
      { label: "Azienda", value: request.companyName },
      { label: "Contatto", value: request.contactName },
      { label: "Email", value: request.contactEmail },
      { label: "Fonte", value: request.source },
      { label: "Creata il", value: formatDateTime(request.createdAt) },
      {
        label: "Ultimo contatto",
        value: formatDateTime(request.lastInteractionAt),
      },
    ],
    [request]
  );

  return (
    <div className="w-full space-y-6 md:space-y-7">
      <header className="rounded-[12px] border border-line-default bg-surface px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className={uiPageTitleDetail}>
              {request.title}
            </h1>
            <p className={cn(uiPageLead, "mt-1.5")}>
              <span className="font-medium text-fg-secondary">
                {request.companyName}
              </span>
              <span className="mx-1.5 text-fg-tertiary" aria-hidden>
                ·
              </span>
              {request.contactName}
            </p>
            <p className={cn(uiPageLead, "mt-1")}>
              <span className="text-fg-tertiary">
                Ultimo aggiornamento
              </span>
              <span className="mx-1.5 text-fg-tertiary" aria-hidden>
                ·
              </span>
              <time
                dateTime={request.updatedAt}
                className="font-semibold tabular-nums text-fg-primary"
              >
                {formatDateTime(request.updatedAt)}
              </time>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-7">
        <div className="space-y-6">
      <Panel>
        <h2 className={uiSectionHeading}>Operativo</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">
          Stato, priorità e assegnazione interna alla coda.
        </p>
        {operationalError ? (
          <p
            role="alert"
            className="mt-3 text-sm leading-relaxed text-danger"
          >
            {operationalError}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 sm:min-w-[12rem]">
            <label htmlFor="detail-status" className={uiFilterLabel}>
              Stato
            </label>
            <select
              id="detail-status"
              className={cn(controlClass, "mt-1.5 w-full min-w-[12rem]")}
              value={request.status}
              disabled={opBusy || nextSaveUi === "saving" || assignmentBusy}
              onChange={(e) => void onStatus(e.target.value as RequestStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 sm:min-w-[10rem]">
            <label htmlFor="detail-priority" className={uiFilterLabel}>
              Priorità
            </label>
            <select
              id="detail-priority"
              className={cn(controlClass, "mt-1.5 w-full min-w-[10rem]")}
              value={request.priority}
              disabled={opBusy || nextSaveUi === "saving" || assignmentBusy}
              onChange={(e) => void onPriority(e.target.value as RequestPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-7 border-t border-line-default pt-6">
          <label htmlFor="detail-assignee" className={uiFilterLabel}>
            Assegnato a
          </label>
          {assignmentErr ? (
            <p
              role="alert"
              className="mt-2 text-sm leading-relaxed text-danger"
            >
              {assignmentErr}
            </p>
          ) : null}
          {canAssignRequests ? (
            <select
              id="detail-assignee"
              className={cn(controlClass, "mt-1.5 w-full min-w-[12rem] sm:max-w-md")}
              disabled={assignmentBusy || opBusy || nextSaveUi === "saving"}
              value={request.assignedUserId ?? ""}
              onChange={(e) => void onAssignmentChange(e.target.value)}
            >
              <option value="">Non assegnata</option>
              {assigneeOptions.map((o) => (
                <option key={o.userId} value={o.userId}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1.5">
              <p className={cn(controlClass, "flex min-h-[2.75rem] items-center bg-field")}>
                <span className="truncate font-medium">
                  {request.assignedToLabel ?? "Non assegnata"}
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-fg-tertiary">
                Solo admin e manager possono modificare l’assegnazione.
              </p>
            </div>
          )}
          {request.assignedAt ? (
            <p className="mt-2 text-xs tabular-nums text-fg-tertiary">
              Assegnata il {formatDateTime(request.assignedAt)}
            </p>
          ) : null}
        </div>

        <div className="mt-7 border-t border-line-default pt-6">
        <h2 className={uiSectionHeading}>Prossima azione</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">
          Scadenza facoltativa. Usa &quot;Salva&quot; per confermare le modifiche.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="detail-next-action" className={uiFilterLabel}>
              Cosa fare
            </label>
            <textarea
              id="detail-next-action"
              rows={4}
              value={nextDraft}
              onChange={(e) => setNextDraft(e.target.value)}
              disabled={opBusy || nextSaveUi === "saving" || assignmentBusy}
              className={cn(inputClass, "mt-1.5 min-h-[6rem] resize-y")}
              placeholder="Prossimo passo operativo…"
            />
          </div>

          <div>
            <label htmlFor="detail-next-at" className={uiFilterLabel}>
              Scadenza (opzionale)
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <input
                id="detail-next-at"
                type="datetime-local"
                value={nextAtDraft}
                onChange={(e) => setNextAtDraft(e.target.value)}
                disabled={opBusy || nextSaveUi === "saving" || assignmentBusy}
                className={cn(inputClass, "min-w-0 flex-1 sm:max-w-[20rem]")}
              />
              {nextAtDraft !== "" || request.nextActionAt !== null ? (
                <button
                  type="button"
                  onClick={() => setNextAtDraft("")}
                  disabled={opBusy || nextSaveUi === "saving" || assignmentBusy}
                  className={cn(uiBtnSecondary, "shrink-0")}
                >
                  Rimuovi scadenza
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-line-default pt-5">
          <button
            type="button"
            disabled={!nextDirty || nextSaveUi === "saving" || opBusy}
            aria-busy={nextSaveUi === "saving"}
            onClick={() => void saveNextAction()}
            className={cn(
              uiBtnPrimary,
              "min-w-[10.5rem] px-4 py-2.5",
              nextSaveUi === "saved"
                ? "border border-success/40 bg-success text-accent-fg hover:brightness-95 disabled:opacity-100"
                : false
            )}
          >
            {nextSaveUi === "saving"
              ? "Salvataggio…"
              : nextSaveUi === "saved"
                ? "Salvato"
                : "Salva prossima azione"}
          </button>
          {nextDirty ? (
            <button
              type="button"
              onClick={() => {
                setNextDraft(request.nextAction);
                setNextAtDraft(toDatetimeLocalValue(request.nextActionAt));
              }}
              className={uiBtnGhost}
            >
              Annulla modifiche
            </button>
          ) : null}
        </div>
        </div>
      </Panel>
        </div>

        <div className="space-y-6">
      <Panel>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={uiSectionHeading}>Anagrafica e contesto</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">
              Cliente, metadati e testo descrittivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className={cn(
              uiBtnSecondary,
              "w-full shrink-0 px-3 py-2.5 sm:w-auto sm:self-start"
            )}
          >
            Modifica dettagli
          </button>
        </div>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {readOnlyFields.map((f) => (
            <div key={f.label}>
              <dt className={cn(uiFilterLabel, "mb-0")}>{f.label}</dt>
              <dd className="mt-1.5 text-[15px] font-medium leading-snug text-fg-primary">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 border-t border-line-default pt-6">
          <h3 className={uiSectionHeading}>Descrizione</h3>
          {request.description?.trim() ? (
            <p className="mt-2.5 text-[15px] leading-relaxed text-fg-secondary">
              {request.description}
            </p>
          ) : (
            <p className="mt-2.5 text-sm italic text-fg-tertiary">
              Nessuna descrizione testuale.
            </p>
          )}
        </div>
      </Panel>

      <Panel>
        <h2 className={uiSectionHeading}>Attività</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">
          Creazione, modifiche a stato e priorità, assegnazione, prossima azione e note — in ordine cronologico.
        </p>
        {activities.length === 0 ? (
          <div className="mt-5">
            <AppEmptyHint
              title="Ancora nessun evento"
              description="Quando salvi modifiche o aggiungi note, la timeline si popolerà automaticamente."
            />
          </div>
        ) : (
          <ol
            className="relative m-0 mt-5 list-none space-y-0 p-0"
            aria-label="Attività"
          >
            {activities.map((a, idx) => (
              <li
                key={a.id}
                className="relative flex gap-3 pb-6 last:pb-0 sm:gap-3.5"
              >
                {idx < activities.length - 1 ? (
                  <span
                    className="absolute bottom-0 left-[9px] top-5 w-px bg-line-default"
                    aria-hidden
                  />
                ) : null}
                <div
                  className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full border border-line-default bg-elevated shadow-sm"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        uiOverline,
                        "text-[10px] tracking-[0.08em] text-fg-tertiary",
                      )}
                    >
                      {activityTypeLabel[a.type]}
                    </span>
                    <time
                      dateTime={a.createdAt}
                      className="text-xs font-semibold tabular-nums text-fg-secondary"
                    >
                      {formatDateTime(a.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-snug text-fg-primary">
                    {a.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel>
        <h2 className={uiSectionHeading}>Note e cronologia</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">
          Note operative e aggiornamenti che aggiungi qui sotto; le voci più recenti sono in cima.
        </p>

        <form
          className="mb-6 mt-6 rounded-[10px] border border-line-default bg-canvas p-3.5 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitNote();
          }}
          aria-label="Aggiungi nota operativa"
        >
          <p className={cn(uiOverline, "mb-2.5 text-fg-tertiary")}>
            Nuova voce
          </p>
          <label htmlFor="note-composer" className="sr-only">
            Testo nuova nota
          </label>
          <textarea
            id="note-composer"
            value={composerBody}
            onChange={(e) => {
              setComposerBody(e.target.value);
              if (noteError) setNoteError(null);
            }}
            onKeyDown={(e) => {
              if (
                (e.metaKey || e.ctrlKey) &&
                e.key === "Enter" &&
                composerBody.trim()
              ) {
                e.preventDefault();
                void submitNote();
              }
            }}
            rows={3}
            placeholder={NOTE_COMPOSER_PLACEHOLDER}
            disabled={noteSaveUi === "saving" || opBusy}
            className={cn(
              inputClass,
              "min-h-[5.5rem] resize-y"
            )}
          />
          {noteError ? (
            <p
              role="alert"
              className="mt-3 text-sm leading-relaxed text-danger"
            >
              {noteError}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={
                !composerBody.trim() || noteSaveUi === "saving" || opBusy
              }
              aria-busy={noteSaveUi === "saving"}
              className={cn(
                uiBtnPrimary,
                "min-w-[7.5rem] px-4 py-2",
                noteSaveUi === "saved"
                  ? "border border-success/40 bg-success text-accent-fg hover:brightness-95 disabled:opacity-100"
                  : false
              )}
            >
              {noteSaveUi === "saving"
                ? "Salvataggio…"
                : noteSaveUi === "saved"
                  ? "Salvato"
                  : "Salva nota"}
            </button>
            {composerBody.trim() ? (
              <button
                type="button"
                onClick={clearComposer}
                className={cn(uiBtnGhost, "py-2")}
              >
                Annulla
              </button>
            ) : null}
            <span className="ml-auto hidden text-xs text-fg-tertiary sm:inline">
              Ctrl/⌘+Invio
            </span>
          </div>
        </form>

        <div
          role="region"
          aria-labelledby="request-notes-timeline"
          className="border-t border-line-default pt-6"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
            <p
              id="request-notes-timeline"
              className={cn(uiOverline, "text-fg-tertiary")}
            >
              Cronologia
            </p>
            {notes.length > 0 ? (
              <span className="text-xs font-medium tabular-nums text-fg-tertiary">
                {notes.length}{" "}
                {notes.length === 1 ? "voce" : "voci"} · dal più recente
              </span>
            ) : null}
          </div>

          {notes.length === 0 ? (
            <AppEmptyHint
              title="Nessuna nota ancora"
              description="Scrivi nel riquadro sopra per registrare aggiornamenti, promemoria o passaggi operativi."
            />
          ) : (
            <div className="relative">
              <div
                className="pointer-events-none absolute bottom-4 left-2.5 top-3 w-px bg-line-default"
                aria-hidden
              />
              <ol className="relative m-0 list-none p-0" aria-label="Cronologia note operative">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="relative flex gap-3.5 pb-7 last:pb-0 sm:gap-4"
                  >
                    <div
                      className="relative z-10 flex w-5 shrink-0 justify-center pt-1"
                      aria-hidden
                    >
                      <span className="h-2.5 w-2.5 rounded-full border border-line-default bg-elevated ring-[3px] ring-canvas" />
                    </div>
                    <article className="min-w-0 flex-1 rounded-[10px] border border-line-default bg-surface px-3.5 py-3.5 sm:px-4 sm:py-4">
                      <header className="flex flex-col gap-1 border-b border-line-default pb-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                        <span
                          className={cn(
                            uiOverline,
                            "w-fit text-[10px] tracking-[0.08em] text-fg-tertiary"
                          )}
                        >
                          Nota operativa
                        </span>
                        <time
                          dateTime={n.createdAt}
                          className="text-[13px] font-semibold tabular-nums tracking-tight text-fg-primary sm:text-sm"
                        >
                          {formatDateTime(n.createdAt)}
                        </time>
                      </header>
                      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.6] text-fg-primary">
                        {n.body}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </Panel>
        </div>
      </div>

      {editOpen ? (
        <EditDetailsSheet
          request={request}
          saveError={detailError}
          saving={detailSaving}
          onClose={() => {
            setDetailError(null);
            setEditOpen(false);
          }}
          onSave={saveDetails}
        />
      ) : null}
    </div>
  );
}

function EditDetailsSheet({
  onClose,
  request,
  onSave,
  saveError,
  saving,
}: {
  onClose: () => void;
  request: Request;
  saveError: string | null;
  saving: boolean;
  onSave: (
    p: Pick<
      Request,
      | "title"
      | "companyName"
      | "contactName"
      | "contactEmail"
      | "source"
      | "description"
    >
  ) => Promise<void>;
}) {
  const titleId = useId();
  const [title, setTitle] = useState(request.title);
  const [companyName, setCompanyName] = useState(request.companyName);
  const [contactName, setContactName] = useState(request.contactName);
  const [contactEmail, setContactEmail] = useState(request.contactEmail);
  const [source, setSource] = useState(request.source);
  const [description, setDescription] = useState(request.description);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Chiudi pannello"
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex h-[100dvh] w-full max-w-full flex-col border-l border-line-strong bg-surface shadow-[var(--shadow-surface)]",
          "sm:h-full sm:max-h-[100dvh] sm:max-w-xl lg:max-w-2xl",
          "sm:rounded-l-[12px]"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line-default px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0 pr-2">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-fg-primary"
            >
              Modifica dettagli
            </h2>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-fg-secondary">
              Annulla chiude senza salvare. Salva applica le modifiche al database.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(uiBtnIcon, "shrink-0 p-2")}
            aria-label="Chiudi"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave({
              title: title.trim() || request.title,
              companyName: companyName.trim(),
              contactName: contactName.trim(),
              contactEmail: contactEmail.trim(),
              source: source.trim(),
              description: description.trim(),
            });
          }}
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {saveError ? (
              <p
                role="alert"
                className="rounded-[10px] border border-danger/30 bg-danger-muted px-3 py-2.5 text-sm text-danger"
              >
                {saveError}
              </p>
            ) : null}
            <div>
              <label htmlFor="edit-title" className={uiFilterLabel}>
                Titolo
              </label>
              <input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className={cn(inputClass, "mt-1.5")}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="edit-company" className={uiFilterLabel}>
                  Azienda
                </label>
                <input
                  id="edit-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={saving}
                  className={cn(inputClass, "mt-1.5")}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-contact" className={uiFilterLabel}>
                  Contatto
                </label>
                <input
                  id="edit-contact"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  disabled={saving}
                  className={cn(inputClass, "mt-1.5")}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-email" className={uiFilterLabel}>
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={saving}
                  className={cn(inputClass, "mt-1.5")}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-source" className={uiFilterLabel}>
                  Fonte
                </label>
                <input
                  id="edit-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={saving}
                  className={cn(inputClass, "mt-1.5")}
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-desc" className={uiFilterLabel}>
                Descrizione
              </label>
              <textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                disabled={saving}
                className={cn(inputClass, "mt-1.5 min-h-[140px] resize-y")}
                required
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-line-default bg-surface px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={cn(uiBtnSecondary, "w-full sm:w-auto")}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className={cn(uiBtnPrimary, "px-4 py-2.5", saving && "cursor-wait")}
              >
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
