"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { StatusBadge } from "@/components/requests/status-badge";
import { updateInboxItemStatus } from "@/lib/actions/update-inbox-status";
import { updateRequestOperational } from "@/lib/actions/update-request-operational";
import { tomorrowAtNineLocalIso } from "@/lib/follow-up-windows";
import { formatDateTime } from "@/lib/date";
import { inboxStatusLabel, statusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
import type { InboxItem } from "@/types/inbox";
import type { Request, RequestStatus } from "@/types/request";

const QUICK_STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

function Section({
  title,
  description,
  children,
  variant,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant: "danger" | "default" | "muted";
}) {
  const bar =
    variant === "danger"
      ? "border-rose-200/80 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/25"
      : variant === "muted"
        ? "border-slate-200/70 dark:border-slate-800"
        : "border-slate-200/80 dark:border-slate-800";

  return (
    <section className="space-y-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className={cn("overflow-hidden rounded-xl border", bar)}>
        {children}
      </div>
    </section>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white px-4 py-8 text-center text-sm text-slate-600 dark:bg-slate-950/35 dark:text-slate-400">
      {children}
    </div>
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

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function postponeTomorrow(id: string) {
    const r = await updateRequestOperational(id, {
      next_action_at: tomorrowAtNineLocalIso(),
      bump_last_interaction: true,
    });
    if (r.ok) refresh();
  }

  async function setStatus(id: string, status: RequestStatus) {
    const r = await updateRequestOperational(id, {
      status,
      bump_last_interaction: true,
    });
    if (r.ok) refresh();
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {requests.map((r) => (
        <div
          key={r.id}
          role="button"
          tabIndex={0}
          onClick={() =>
            router.push(`/app/requests/${r.id}`, { scroll: true })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/app/requests/${r.id}`, { scroll: true });
            }
          }}
          className={cn(
            uiTransition,
            "group grid cursor-pointer gap-3 bg-white px-4 py-3 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:bg-slate-950/35",
            accent === "danger"
              ? "hover:bg-rose-50/60 dark:hover:bg-rose-950/20"
              : "hover:bg-slate-50/90 dark:hover:bg-slate-900/50",
            pending && "pointer-events-none opacity-80",
          )}
        >
          <div className="min-w-0">
            <p className="font-medium leading-snug text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100">
              {r.title}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">
              {r.companyName}
              {r.nextActionAt ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="tabular-nums">
                    {formatDateTime(r.nextActionAt)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={r.priority} />
              <StatusBadge status={r.status} />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <select
                aria-label="Cambia stato"
                className={cn(
                  uiTransition,
                  "max-w-[11rem] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800",
                  "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
                )}
                value={r.status}
                disabled={pending}
                onChange={(e) =>
                  setStatus(r.id, e.target.value as RequestStatus)
                }
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
                className={cn(
                  uiBtnSecondary,
                  "whitespace-nowrap px-2.5 py-1.5 text-xs",
                )}
                onClick={() => postponeTomorrow(r.id)}
              >
                Domani 9:00
              </button>
              <Link
                href={`/app/requests/${r.id}`}
                className={cn(
                  uiTransition,
                  "rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm",
                  "hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                )}
              >
                Apri
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxBlock({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function archivia(id: string) {
    const r = await updateInboxItemStatus(id, "archived");
    if (r.ok) refresh();
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((r) => (
        <div
          key={r.id}
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/app/inbox/${r.id}`, { scroll: true })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/app/inbox/${r.id}`, { scroll: true });
            }
          }}
          className={cn(
            uiTransition,
            "group grid cursor-pointer gap-3 bg-white px-4 py-3 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:bg-slate-950/35",
            "hover:bg-slate-50/90 dark:hover:bg-slate-900/50",
            pending && "pointer-events-none opacity-80",
          )}
        >
          <div className="min-w-0">
            <p className="font-medium leading-snug text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100">
              {r.subject || "(Senza oggetto)"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
              {[r.source, r.senderName].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <InboxStatusBadge status={r.status} />
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <button
                type="button"
                disabled={pending}
                className={cn(
                  uiBtnSecondary,
                  "whitespace-nowrap px-2.5 py-1.5 text-xs",
                )}
                onClick={() => archivia(r.id)}
              >
                Archivia
              </button>
              <Link
                href={`/app/inbox/${r.id}`}
                className={cn(
                  uiTransition,
                  "rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900",
                  "hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40",
                )}
              >
                Converti
              </Link>
            </div>
          </div>
        </div>
      ))}
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
    <div className="space-y-8 md:space-y-10">
      <Section
        variant="danger"
        title="In ritardo"
        description="Prossima azione prima di oggi (calendario locale), escluse le richieste chiuse."
      >
        {overdue.length === 0 ? (
          <EmptyRow>Nessuna richiesta in ritardo.</EmptyRow>
        ) : (
          <RequestBlock requests={overdue} accent="danger" />
        )}
      </Section>

      <Section
        variant="default"
        title="Oggi"
        description="Prossima azione prevista per oggi."
      >
        {today.length === 0 ? (
          <EmptyRow>Niente in scadenza oggi.</EmptyRow>
        ) : (
          <RequestBlock requests={today} accent="default" />
        )}
      </Section>

      <Section
        variant="muted"
        title="Prossimi 7 giorni"
        description="Dalla prossima mezzanotte fino alla fine del settimo giorno."
      >
        {upcoming.length === 0 ? (
          <EmptyRow>Nessuna scadenza in questa finestra.</EmptyRow>
        ) : (
          <RequestBlock requests={upcoming} accent="default" />
        )}
      </Section>

      <Section
        variant="muted"
        title="Inbox da triage"
        description={`Stato ${inboxStatusLabel.new} o ${inboxStatusLabel.reviewed}, non convertiti. Archivia per togliere dalla coda; Converti apre il dettaglio con il modulo richiesta.`}
      >
        {inbox.length === 0 ? (
          <EmptyRow>Inbox di triage vuota.</EmptyRow>
        ) : (
          <InboxBlock items={inbox} />
        )}
      </Section>
    </div>
  );
}
