import type { DashboardActivityItem } from "@/lib/supabase/dashboard-queries";
import { activityTypeLabel } from "@/lib/labels";
import {
  DashboardFeedCard,
  type DashboardFeedItem,
} from "@/components/dashboard/dashboard-activity-feed";

function toFeedItem(a: DashboardActivityItem): DashboardFeedItem {
  return {
    id: a.id,
    href: `/app/requests/${a.requestId}`,
    typeLabel: activityTypeLabel[a.type],
    createdAt: a.createdAt,
    contextLine: a.requestTitle,
    body: a.body,
  };
}

export function DashboardRecentActivities({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  return (
    <DashboardFeedCard
      title="Timeline"
      description="Ultime azioni sulle richieste."
      items={items.map(toFeedItem)}
      emptyTitle="Vuota"
      emptyDescription="Le attività registrate compariranno qui."
    />
  );
}
