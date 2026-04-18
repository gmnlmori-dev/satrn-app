import Link from "next/link";
import type { Request } from "@/types/request";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { StatusBadge } from "@/components/requests/status-badge";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { formatDateTime } from "@/lib/date";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { uiOverline } from "@/lib/typography";

function PanelShell({
  kicker,
  title,
  actionHref,
  actionLabel,
  children,
}: {
  kicker: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100/90 px-4 py-3.5 md:px-5 dark:border-slate-800">
        <div className="min-w-0">
          <p className={uiOverline}>{kicker}</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900 md:text-lg dark:text-slate-100">
            {title}
          </h2>
        </div>
        <Link
          href={actionHref}
          className={cn(
            uiTransition,
            uiFocusRingOffset,
            "shrink-0 rounded-md border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          {actionLabel}
        </Link>
      </div>
      <div className="flex-1 px-4 py-4 md:px-5 md:py-5">{children}</div>
    </div>
  );
}

export function DashboardTodayPanel({ items }: { items: Request[] }) {
  return (
    <PanelShell
      kicker="Priorità giornata"
      title="Da seguire oggi"
      actionHref="/app/requests"
      actionLabel="Apri scrivania"
    >
      {items.length === 0 ? (
        <AppEmptyHint
          title="Niente in scadenza oggi"
          description="Le richieste con prossima azione impostata per oggi compariranno qui. Apri la scrivania per l’elenco completo."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/requests/${r.id}`}
                className="group block rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/35 dark:hover:bg-slate-800/45"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold leading-snug text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100">
                    {r.title}
                  </span>
                  <StatusBadge status={r.status} />
                  <PriorityBadge priority={r.priority} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {r.nextAction}
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-500">
                  {r.companyName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export function DashboardRecentPanel({ items }: { items: Request[] }) {
  return (
    <PanelShell
      kicker="Scrivania"
      title="Aggiornate di recente"
      actionHref="/app/requests"
      actionLabel="Vedi tutte"
    >
      {items.length === 0 ? (
        <AppEmptyHint
          title="Nessun aggiornamento recente"
          description="Quando modifichi o annoti una richiesta, l’ultima attività comparirà in questo riquadro."
        />
      ) : (
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              href={`/app/requests/${r.id}`}
              className="group flex gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100">
                  {r.title}
                </p>
                <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-500">
                  {r.companyName} · {r.contactName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge status={r.status} />
                <time
                  className="mt-1.5 block text-xs font-medium tabular-nums leading-snug text-slate-700 dark:text-slate-300"
                  dateTime={r.updatedAt}
                >
                  {formatDateTime(r.updatedAt)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      )}
    </PanelShell>
  );
}
