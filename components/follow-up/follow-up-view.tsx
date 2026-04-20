"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { StatusBadge } from "@/components/requests/status-badge";
import { updateInboxItemStatus } from "@/lib/actions/update-inbox-status";
import { updateRequestOperational } from "@/lib/actions/update-request-operational";
import {
  daysFromTodayAtNineDatetimeLocal,
  tomorrowAtNineDatetimeLocal,
} from "@/lib/follow-up-windows";
import { formatDateTime, fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/date";
import { inboxStatusLabel, statusLabel } from "@/lib/labels";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { InboxItem } from "@/types/inbox";
import type { Request, RequestStatus } from "@/types/request";

const QUICK_STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const datetimeInputClass = cn(
  uiTransition,
  "w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] leading-snug text-slate-900",
  "focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-100/10",
);

const tableHeadCell =
  "border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400";

const tableRowInteractive = cn(
  uiTransition,
  "cursor-pointer border-b border-slate-100 last:border-b-0 dark:border-slate-800/80",
);

function Section({
  anchorId,
  title,
  description,
  count,
  children,
  variant,
}: {
  /** Ancora per link dalla dashboard (`/app/follow-up#...`). */
  anchorId?: string;
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
  variant: "danger" | "default" | "muted";
}) {
  const bar =
    variant === "danger"
      ? "border-rose-200/80 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20"
      : variant === "muted"
        ? "border-slate-200/70 dark:border-slate-800"
        : "border-slate-200/80 dark:border-slate-800";

  const countStyles =
    variant === "danger"
      ? "bg-rose-600/10 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
      : variant === "default"
        ? "bg-slate-900/8 text-slate-800 dark:bg-slate-100/10 dark:text-slate-200"
        : "bg-slate-900/6 text-slate-700 dark:bg-slate-100/8 dark:text-slate-300";

  return (
    <section id={anchorId} className="scroll-mt-24 space-y-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {count !== undefined ? (
            <span
              className={cn(
                "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums",
                countStyles,
              )}
            >
              {count}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className={cn("overflow-hidden rounded-2xl border shadow-sm shadow-slate-900/[0.03] dark:shadow-none", bar)}>
        {children}
      </div>
    </section>
  );
}

function EmptyRow({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white px-3 py-3 sm:px-4 dark:bg-slate-950/35">
      <AppEmptyHint title={title} description={hint} className="py-6" />
    </div>
  );
}

function PostponeScadenzaDialog({
  request,
  onDismiss,
  onApplied,
}: {
  request: Request;
  onDismiss: () => void;
  onApplied: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(
    () => toDatetimeLocalValue(request.nextActionAt) || tomorrowAtNineDatetimeLocal(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, []);

  async function apply() {
    if (saving) return;
    const iso = fromDatetimeLocalValue(draft);
    if (!iso) {
      setError("Imposta una data e un orario validi.");
      return;
    }
    setError(null);
    setSaving(true);
    const r = await updateRequestOperational(request.id, {
      next_action_at: iso,
      bump_last_interaction: true,
    });
    setSaving(false);
    if (r.ok) {
      onDismiss();
      onApplied();
    } else {
      setError(r.message);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onDismiss}
      className={cn(
        uiTransition,
        "w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xl",
        "dark:border-slate-700 dark:bg-slate-900",
        "backdrop:bg-slate-950/45 backdrop:backdrop-blur-[2px]",
      )}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Sposta scadenza
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">{request.title}</span>
            <span className="text-slate-500 dark:text-slate-500"> · {request.companyName}</span>
          </p>
        </div>

        <div>
          <span className={uiFormLabel}>Scorciatoie</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              className={cn(uiBtnSecondary, "px-3 py-2 text-xs")}
              onClick={() => setDraft(tomorrowAtNineDatetimeLocal())}
            >
              Domani 9:00
            </button>
            <button
              type="button"
              disabled={saving}
              className={cn(uiBtnSecondary, "px-3 py-2 text-xs")}
              onClick={() => setDraft(daysFromTodayAtNineDatetimeLocal(3))}
            >
              Tra 3 giorni 9:00
            </button>
            <button
              type="button"
              disabled={saving}
              className={cn(uiBtnSecondary, "px-3 py-2 text-xs")}
              onClick={() => setDraft(daysFromTodayAtNineDatetimeLocal(7))}
            >
              Tra 7 giorni 9:00
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="followup-postpone-at" className={uiFormLabel}>
            Data e ora
          </label>
          <input
            id="followup-postpone-at"
            type="datetime-local"
            value={draft}
            disabled={saving}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            className={cn(datetimeInputClass, "mt-1.5")}
          />
          {error ? (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            disabled={saving}
            className={cn(uiBtnSecondary, "px-4 py-2.5 text-sm")}
            onClick={onDismiss}
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={saving}
            className={cn(uiBtnPrimary, "min-w-[7rem] px-4 py-2.5 text-sm")}
            onClick={() => void apply()}
          >
            {saving ? "Salvataggio…" : "Applica"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function RequestBlock({
  requests,
  accent,
}: {
  requests: Request[];
  accent: "danger" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { pulseTopBar } = useDetailSaveFeedback();
  const [postponeTarget, setPostponeTarget] = useState<Request | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function setStatus(id: string, status: RequestStatus) {
    const r = await updateRequestOperational(id, {
      status,
      bump_last_interaction: true,
    });
    if (r.ok) {
      pulseTopBar();
      refresh();
    }
  }

  function rowNavigate(id: string, e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, select, input, textarea")) return;
    router.push(`/app/requests/${id}`, { scroll: true });
  }

  const rowHover =
    accent === "danger"
      ? "hover:bg-rose-50/70 dark:hover:bg-rose-950/25"
      : "hover:bg-slate-50/90 dark:hover:bg-slate-900/40";

  return (
    <>
      {postponeTarget ? (
        <PostponeScadenzaDialog
          key={postponeTarget.id}
          request={postponeTarget}
          onDismiss={() => setPostponeTarget(null)}
          onApplied={() => {
            pulseTopBar();
            refresh();
          }}
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className={cn(tableHeadCell, "rounded-tl-2xl")}>Richiesta</th>
              <th className={tableHeadCell}>Azienda</th>
              <th className={tableHeadCell}>Scadenza</th>
              <th className={tableHeadCell}>Priorità · Stato</th>
              <th className={cn(tableHeadCell, "rounded-tr-2xl text-right")}>Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-950/35">
            {requests.map((r) => (
              <tr
                key={r.id}
                className={cn(tableRowInteractive, rowHover, pending && "pointer-events-none opacity-75")}
                onClick={(e) => rowNavigate(r.id, e)}
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/app/requests/${r.id}`}
                    className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="max-w-[12rem] px-4 py-3 align-top text-slate-600 dark:text-slate-400">
                  <span className="line-clamp-2">{r.companyName}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top tabular-nums text-slate-700 dark:text-slate-300">
                  {r.nextActionAt ? formatDateTime(r.nextActionAt) : "—"}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                  </div>
                </td>
                <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    <select
                      aria-label="Cambia stato"
                      className={cn(
                        uiTransition,
                        "max-w-[11rem] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800",
                        "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
                      )}
                      value={r.status}
                      disabled={pending}
                      onChange={(e) => setStatus(r.id, e.target.value as RequestStatus)}
                    >
                      {QUICK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={pending}
                      className={cn(uiBtnSecondary, "whitespace-nowrap px-3 py-2 text-xs")}
                      onClick={() => setPostponeTarget(r)}
                    >
                      Sposta scadenza
                    </button>
                    <Link
                      href={`/app/requests/${r.id}`}
                      className={cn(
                        uiTransition,
                        "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm",
                        "hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      Apri
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InboxBlock({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { pulseTopBar } = useDetailSaveFeedback();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function archivia(id: string) {
    const r = await updateInboxItemStatus(id, "archived");
    if (r.ok) {
      pulseTopBar();
      refresh();
    }
  }

  function rowNavigate(id: string, e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, select, input")) return;
    router.push(`/app/inbox/${id}`, { scroll: true });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className={cn(tableHeadCell, "rounded-tl-2xl")}>Oggetto</th>
            <th className={tableHeadCell}>Mittente · Origine</th>
            <th className={tableHeadCell}>Stato</th>
            <th className={cn(tableHeadCell, "rounded-tr-2xl text-right")}>Azioni</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-950/35">
          {items.map((r) => (
            <tr
              key={r.id}
              className={cn(
                tableRowInteractive,
                "hover:bg-slate-50/90 dark:hover:bg-slate-900/40",
                pending && "pointer-events-none opacity-75",
              )}
              onClick={(e) => rowNavigate(r.id, e)}
            >
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/app/inbox/${r.id}`}
                  className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {r.subject || "(Senza oggetto)"}
                </Link>
              </td>
              <td className="max-w-[14rem] px-4 py-3 align-top text-slate-600 dark:text-slate-400">
                <span className="line-clamp-2">
                  {[r.senderName, r.source].filter(Boolean).join(" · ") || "—"}
                </span>
              </td>
              <td className="px-4 py-3 align-top">
                <InboxStatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={pending}
                    className={cn(uiBtnSecondary, "whitespace-nowrap px-3 py-2 text-xs")}
                    onClick={() => archivia(r.id)}
                  >
                    Archivia
                  </button>
                  <Link
                    href={`/app/inbox/${r.id}`}
                    className={cn(
                      uiTransition,
                      "inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900",
                      "hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40",
                    )}
                  >
                    Converti
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FollowUpView({
  overdue,
  today,
  upcoming,
  inbox,
}: {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  inbox: InboxItem[];
}) {
  return (
    <div className="space-y-10 md:space-y-12">
      <Section
        anchorId="follow-up-overdue"
        variant="danger"
        title="In ritardo"
        count={overdue.length}
        description="Prossima azione prima di oggi (calendario locale), escluse le richieste chiuse."
      >
        {overdue.length === 0 ? (
          <EmptyRow
            title="Nessun ritardo"
            hint="Nessuna richiesta ha la prossima azione impostata prima di oggi (richieste chiuse escluse)."
          />
        ) : (
          <RequestBlock requests={overdue} accent="danger" />
        )}
      </Section>

      <Section
        anchorId="follow-up-today"
        variant="default"
        title="Oggi"
        count={today.length}
        description="Prossima azione prevista per oggi."
      >
        {today.length === 0 ? (
          <EmptyRow
            title="Niente in scadenza oggi"
            hint="Le richieste con prossima azione prevista per oggi compariranno in questo blocco."
          />
        ) : (
          <RequestBlock requests={today} accent="default" />
        )}
      </Section>

      <Section
        anchorId="follow-up-upcoming"
        variant="muted"
        title="Prossimi 7 giorni"
        count={upcoming.length}
        description="Dalla prossima mezzanotte fino alla fine del settimo giorno."
      >
        {upcoming.length === 0 ? (
          <EmptyRow
            title="Nessuna scadenza nei prossimi 7 giorni"
            hint="Domani fino al settimo giorno non risultano azioni programmate."
          />
        ) : (
          <RequestBlock requests={upcoming} accent="default" />
        )}
      </Section>

      <Section
        anchorId="follow-up-inbox"
        variant="muted"
        title="Inbox da triage"
        count={inbox.length}
        description={`Ingressi in stato ${inboxStatusLabel.new} o ${inboxStatusLabel.reviewed}, non ancora convertiti. Archivia per toglierli dalla coda; Converti apre il dettaglio con il modulo di creazione richiesta.`}
      >
        {inbox.length === 0 ? (
          <EmptyRow
            title="Nessun ingresso da triage"
            hint="Gli elementi in stato Nuovo o Esaminato, non ancora convertiti in richiesta, compariranno qui."
          />
        ) : (
          <InboxBlock items={inbox} />
        )}
      </Section>
    </div>
  );
}
