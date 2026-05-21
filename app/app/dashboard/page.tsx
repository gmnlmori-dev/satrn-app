import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMyWorkStrip } from "@/components/dashboard/dashboard-my-work-strip";
import { DashboardOperationalStrip } from "@/components/dashboard/dashboard-operational-strip";
import { DashboardRecentActivities } from "@/components/dashboard/dashboard-recent-activities";
import { DashboardRecentPanel } from "@/components/dashboard/dashboard-panels";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import {
  getDashboardMineCounts,
  getDashboardOperationalCounts,
  getRecentActivitiesGlobal,
  getRecentlyUpdatedRequests,
  getRequestsTotalCount,
} from "@/lib/supabase/dashboard-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { uiLink } from "@/lib/ui-classes";

export const metadata = {
  title: "Dashboard",
};

const DASHBOARD_FEED_LIMIT = 5;

export default async function DashboardPage() {
  const profile = await getCurrentProfileSummary();
  const userId = profile?.userId ?? "";
  const teamScope = profile
    ? { role: profile.role, teamId: profile.teamId }
    : { role: "operator" as const, teamId: "" };

  const [counts, mineCounts, activities, recentRequests, totalRequests] =
    await Promise.all([
      getDashboardOperationalCounts(teamScope),
      getDashboardMineCounts(userId, teamScope),
      getRecentActivitiesGlobal(teamScope, DASHBOARD_FEED_LIMIT),
      getRecentlyUpdatedRequests(teamScope, DASHBOARD_FEED_LIMIT),
      getRequestsTotalCount(teamScope),
    ]);

  return (
    <div className="space-y-8">
      <DashboardHeader />

      {totalRequests === 0 ? (
        <AppEmptyState
          icon="queue"
          title="Nessuna richiesta"
          description="Crea la prima richiesta o usa l'inbox per triage."
        >
          <Link href="/app/follow-up" className={uiLink}>
            Da seguire
          </Link>
        </AppEmptyState>
      ) : (
        <>
          {mineCounts ? <DashboardMyWorkStrip counts={mineCounts} /> : null}
          <DashboardOperationalStrip
            counts={counts}
            teamScoped={teamScope.role !== "admin"}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <DashboardRecentActivities items={activities} />
            <DashboardRecentPanel items={recentRequests} />
          </div>
        </>
      )}
    </div>
  );
}
