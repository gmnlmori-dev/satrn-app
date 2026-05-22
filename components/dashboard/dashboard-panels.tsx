import Link from "next/link";
import type { Request } from "@/types/request";
import { cn } from "@/lib/cn";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { StatusBadge } from "@/components/requests/status-badge";
import { formatDateTime } from "@/lib/date";
import { statusLabel } from "@/lib/labels";
import {
  resolveDashboardFeedScope,
  type DashboardViewerContext,
} from "@/lib/dashboard-feed-scope";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import {
  DashboardFeedCard,
  type DashboardFeedItem,
} from "@/components/dashboard/dashboard-activity-feed";
import { uiCard } from "@/lib/surfaces";
import { uiMono, uiSectionTitle } from "@/lib/typography";

function PanelShell({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(uiCard, "flex min-h-0 flex-col overflow-hidden")}>
      <div className="flex items-center justify-between gap-3 border-b border-line-default px-4 py-3 md:px-5">
        <h2 className={uiSectionTitle}>{title}</h2>
        <Link href={actionHref} className={cn(uiBtnSecondary, "shrink-0 px-2.5 py-1 text-xs")}>
          {actionLabel}
        </Link>
      </div>
      <div className="flex-1 p-4 md:p-5">{children}</div>
    </div>
  );
}

export function DashboardTodayPanel({ items }: { items: Request[] }) {
  return (
    <PanelShell title="Aggiornate di recente" actionHref="/app/requests" actionLabel="Vedi tutte">
      {items.length === 0 ? (
        <AppEmptyHint title="Nessun aggiornamento" description="Le richieste modificate di recente compariranno qui." />
      ) : (
        <ul className="divide-y divide-line-default">
          {items.map((r) => (
            <li key={r.id}>
              <Link href={`/app/requests/${r.id}`} className="group flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-elevated">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg-primary group-hover:text-accent">{r.title}</p>
                  <p className="mt-0.5 truncate text-xs text-fg-tertiary">{r.companyName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge status={r.status} />
                  <time className={cn(uiMono, "mt-1 block")} dateTime={r.updatedAt}>
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

export function DashboardRecentPanel({
  items,
  viewer,
}: {
  items: Request[];
  viewer: DashboardViewerContext;
}) {
  const feedItems: DashboardFeedItem[] = items.map((r) => {
    const contextParts = [r.companyName?.trim(), r.assignedToLabel?.trim()].filter(
      Boolean,
    );

    return {
      id: r.id,
      href: `/app/requests/${r.id}`,
      typeLabel: statusLabel[r.status],
      createdAt: r.updatedAt,
      contextLine: contextParts.length > 0 ? contextParts.join(" · ") : null,
      body: r.title,
      scopeTag: resolveDashboardFeedScope({
        viewer,
        requestTeamId: r.teamId,
        requestTeamName: r.teamName,
        assignedUserId: r.assignedUserId,
      }),
    };
  });

  return (
    <DashboardFeedCard
      title="Attività recenti"
      description="Richieste aggiornate di recente, con tag di ambito."
      actionHref="/app/requests"
      actionLabel="Scrivania"
      items={feedItems}
      emptyTitle="Nessuna attività"
      emptyDescription="Le richieste modificate di recente compariranno qui."
      showScopeLegend
      scopeLegendOtherTeam={viewer.role === "admin"}
    />
  );
}
