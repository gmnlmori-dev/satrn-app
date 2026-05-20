import Link from "next/link";
import type { Request } from "@/types/request";
import { cn } from "@/lib/cn";
import { uiBtnSecondary, uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { StatusBadge } from "@/components/requests/status-badge";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { formatDateTime } from "@/lib/date";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { uiMono, uiOverline } from "@/lib/typography";
import { uiPanel } from "@/lib/surfaces";

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
    <div className={cn(uiPanel, "flex min-h-0 flex-col overflow-hidden")}>
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3.5 md:px-5">
        <div className="min-w-0">
          <p className={uiOverline}>{kicker}</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-primary md:text-lg">
            {title}
          </h2>
        </div>
        <Link href={actionHref} className={cn(uiBtnSecondary, "shrink-0 px-2.5 py-1 text-xs")}>
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
          description="Le richieste con prossima azione impostata per oggi compariranno qui."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/requests/${r.id}`}
                className="group block rounded-lg border border-border-subtle bg-inset p-3 transition-colors hover:bg-panel-hover"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-primary underline-offset-2 group-hover:underline">
                    {r.title}
                  </span>
                  <StatusBadge status={r.status} />
                  <PriorityBadge priority={r.priority} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {r.nextAction}
                </p>
                <p className="mt-1.5 text-xs text-muted">{r.companyName}</p>
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
          description="Quando modifichi o annoti una richiesta, l'ultima attività comparirà qui."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/requests/${r.id}`}
                className="group flex gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary underline-offset-2 group-hover:underline">
                    {r.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {r.companyName} · {r.contactName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge status={r.status} />
                  <time className={cn(uiMono, "mt-1.5 block text-xs")} dateTime={r.updatedAt}>
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
