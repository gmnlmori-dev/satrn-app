import type { DashboardActivityItem } from "@/lib/supabase/dashboard-queries";
import {
  resolveDashboardFeedScope,
  type DashboardViewerContext,
} from "@/lib/dashboard-feed-scope";
import { activityTypeLabel } from "@/lib/labels";
import {
  DashboardFeedCard,
  type DashboardFeedItem,
} from "@/components/dashboard/dashboard-activity-feed";

function toFeedItem(
  a: DashboardActivityItem,
  viewer: DashboardViewerContext,
): DashboardFeedItem {
  return {
    id: a.id,
    href: `/app/requests/${a.requestId}`,
    typeLabel: activityTypeLabel[a.type],
    createdAt: a.createdAt,
    contextLine: a.requestTitle,
    body: a.body,
    scopeTag: resolveDashboardFeedScope({
      viewer,
      requestTeamId: a.requestTeamId,
      requestTeamName: a.requestTeamName,
      assignedUserIds: a.assignedUserIds,
      activityMeta: a.meta,
    }),
  };
}

export function DashboardRecentActivities({
  items,
  viewer,
}: {
  items: DashboardActivityItem[];
  viewer: DashboardViewerContext;
}) {
  return (
    <DashboardFeedCard
      title="Timeline"
      description="Ultime azioni sulle richieste, con tag di ambito."
      items={items.map((item) => toFeedItem(item, viewer))}
      emptyTitle="Vuota"
      emptyDescription="Le attività registrate compariranno qui."
      showScopeLegend
      scopeLegendOtherTeam={viewer.role === "admin"}
    />
  );
}
