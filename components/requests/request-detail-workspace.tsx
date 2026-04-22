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
import { updateRequestDetails } from "@/lib/actions/update-request-details";
import { updateRequestOperational } from "@/lib/actions/update-request-operational";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
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

const controlClass = cn(
  uiTransition,
  "w-full min-w-0 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2.5 text-[15px] leading-snug text-slate-900",
  "focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-100/10"
);

const inputClass = cn(
  uiTransition,
  "w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] leading-snug text-slate-900",
  "placeholder:text-slate-500 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-100/10"
);

type Props = {
  initialRequest: Request;
  initialNotes: RequestNote[];
  initialActivities: RequestActivity[];
};

/**
 * Dettaglio: lettura da Supabase; operativi e note salvati su Supabase.
 */
export function RequestDetailWorkspace({
  initialRequest,
  initialNotes,
  initialActivities,
}: Props) {
  const router = useRouter();
  const [request, setRequest] = useState<Request>(initialRequest);
  const [notes, setNotes] = useState<RequestNote[]>(initialNotes);
  const [activities, setActivities] =
    useState<RequestActivity[]>(initialActivities);
  const [editOpen, setEditOpen] = useState(false);
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
      <header className="rounded-xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900/45 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className={uiPageTitleDetail}>
              {request.title}
            </h1>
            <p className={cn(uiPageLead, "mt-1.5")}>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {request.companyName}
              </span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-600" aria-hidden>
                ·
              </span>
              {request.contactName}
            </p>
            <p className={cn(uiPageLead, "mt-1")}>
              <span className="text-slate-500 dark:text-slate-500">
                Ultimo aggiornamento
              </span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-600" aria-hidden>
                ·
              </span>
              <time
                dateTime={request.updatedAt}
                className="font-semibold tabular-nums text-slate-800 dark:text-slate-200"
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

      <SurfaceCard className="border-slate-200/70 dark:border-slate-800">
        <h2 className={uiSectionHeading}>Operativo</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Stato e priorità della coda.
        </p>
        {operationalError ? (
          <p
            role="alert"
            className="mt-3 text-sm leading-relaxed text-rose-700 dark:text-rose-300"
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
              disabled={opBusy || nextSaveUi === "saving"}
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
              disabled={opBusy || nextSaveUi === "saving"}
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
      </SurfaceCard>

      <SurfaceCard className="border-slate-200/70 dark:border-slate-800">
        <h2 className={uiSectionHeading}>Prossima azione</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
              disabled={opBusy || nextSaveUi === "saving"}
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
                disabled={opBusy || nextSaveUi === "saving"}
                className={cn(inputClass, "min-w-0 flex-1 sm:max-w-[20rem]")}
              />
              {nextAtDraft !== "" || request.nextActionAt !== null ? (
                <button
                  type="button"
                  onClick={() => setNextAtDraft("")}
                  disabled={opBusy || nextSaveUi === "saving"}
                  className={cn(uiBtnSecondary, "shrink-0")}
                >
                  Rimuovi scadenza
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
          <button
            type="button"
            disabled={!nextDirty || nextSaveUi === "saving" || opBusy}
            aria-busy={nextSaveUi === "saving"}
            onClick={() => void saveNextAction()}
            className={cn(
              uiBtnPrimary,
              "min-w-[10.5rem] px-4 py-2.5",
              nextSaveUi === "saved"
                ? "border border-emerald-600/30 bg-emerald-700 text-white hover:bg-emerald-700 disabled:opacity-100 disabled:hover:bg-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-800 dark:hover:bg-emerald-800 dark:disabled:hover:bg-emerald-800"
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
      </SurfaceCard>

      <SurfaceCard className="border-slate-200/70 dark:border-slate-800">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={uiSectionHeading}>Anagrafica e contesto</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
              <dd className="mt-1.5 text-[15px] font-medium leading-snug text-slate-900 dark:text-slate-100">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800">
          <h3 className={uiSectionHeading}>Descrizione</h3>
          {request.description?.trim() ? (
            <p className="mt-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
              {request.description}
            </p>
          ) : (
            <p className="mt-2.5 text-sm italic text-slate-500 dark:text-slate-500">
              Nessuna descrizione testuale.
            </p>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="border-slate-200/70 dark:border-slate-800">
        <h2 className={uiSectionHeading}>Attività</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Creazione, modifiche a stato e priorità, prossima azione e note — in ordine cronologico.
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
                    className="absolute bottom-0 left-[9px] top-5 w-px bg-slate-200/90 dark:bg-slate-700/90"
                    aria-hidden
                  />
                ) : null}
                <div
                  className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        uiOverline,
                        "text-[10px] tracking-[0.08em] text-slate-500 dark:text-slate-500",
                      )}
                    >
                      {activityTypeLabel[a.type]}
                    </span>
                    <time
                      dateTime={a.createdAt}
                      className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400"
                    >
                      {formatDateTime(a.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-snug text-slate-800 dark:text-slate-200">
                    {a.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SurfaceCard>

      <SurfaceCard className="border-slate-200/70 dark:border-slate-800">
        <h2 className={uiSectionHeading}>Note e cronologia</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Note operative e aggiornamenti che aggiungi qui sotto; le voci più recenti sono in cima.
        </p>

        <form
          className="mb-6 mt-6 rounded-lg border border-slate-200/90 bg-slate-50/90 p-3.5 dark:border-slate-700 dark:bg-slate-950/45 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitNote();
          }}
          aria-label="Aggiungi nota operativa"
        >
          <p className={cn(uiOverline, "mb-2.5 text-slate-500 dark:text-slate-500")}>
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
              "min-h-[5.5rem] resize-y border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-900"
            )}
          />
          {noteError ? (
            <p
              role="alert"
              className="mt-3 text-sm leading-relaxed text-rose-700 dark:text-rose-300"
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
                  ? "border border-emerald-600/30 bg-emerald-700 text-white hover:bg-emerald-700 disabled:opacity-100 disabled:hover:bg-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-800 dark:hover:bg-emerald-800 dark:disabled:hover:bg-emerald-800"
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
            <span className="ml-auto hidden text-xs text-slate-500 sm:inline dark:text-slate-500">
              Ctrl/⌘+Invio
            </span>
          </div>
        </form>

        <div
          role="region"
          aria-labelledby="request-notes-timeline"
          className="border-t border-slate-100 pt-6 dark:border-slate-800"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
            <p
              id="request-notes-timeline"
              className={cn(uiOverline, "text-slate-500 dark:text-slate-500")}
            >
              Cronologia
            </p>
            {notes.length > 0 ? (
              <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-500">
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
                className="pointer-events-none absolute bottom-4 left-2.5 top-3 w-px bg-slate-200/95 dark:bg-slate-700/90"
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
                      <span className="h-2.5 w-2.5 rounded-full border border-slate-300/80 bg-slate-100 shadow-sm ring-[3px] ring-white dark:border-slate-600 dark:bg-slate-700 dark:ring-slate-900" />
                    </div>
                    <article className="min-w-0 flex-1 rounded-lg border border-slate-200/90 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700/90 dark:bg-slate-900/40 dark:shadow-none sm:px-4 sm:py-4">
                      <header className="flex flex-col gap-1 border-b border-slate-100 pb-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 dark:border-slate-800">
                        <span
                          className={cn(
                            uiOverline,
                            "w-fit text-[10px] tracking-[0.08em] text-slate-500 dark:text-slate-500"
                          )}
                        >
                          Nota operativa
                        </span>
                        <time
                          dateTime={n.createdAt}
                          className="text-[13px] font-semibold tabular-nums tracking-tight text-slate-900 sm:text-sm dark:text-slate-100"
                        >
                          {formatDateTime(n.createdAt)}
                        </time>
                      </header>
                      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.6] text-slate-800 dark:text-slate-200">
                        {n.body}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </SurfaceCard>

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
        className="absolute inset-0 bg-black/15 backdrop-blur-sm transition-opacity dark:bg-black/28"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex h-[100dvh] w-full max-w-full flex-col border-l border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)]",
          "sm:h-full sm:max-h-[100dvh] sm:max-w-xl lg:max-w-2xl",
          "sm:rounded-l-2xl dark:border-slate-800 dark:bg-slate-900"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/90 px-4 py-3.5 sm:px-5 sm:py-4 dark:border-slate-800">
          <div className="min-w-0 pr-2">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Modifica dettagli
            </h2>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
                className="rounded-lg border border-rose-200/90 bg-rose-50/90 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
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
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900 sm:px-5 sm:py-4">
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
