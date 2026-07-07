import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardIdentity } from "@/components/dashboard/dashboard-identity";
import { DashboardQueueOverview } from "@/components/dashboard/dashboard-queue-overview";
import { DashboardRecentActivities } from "@/components/dashboard/dashboard-recent-activities";
import { DashboardRecentPanel } from "@/components/dashboard/dashboard-panels";
import { DashboardSecondaryFeed } from "@/components/dashboard/dashboard-secondary-feed";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { isInboxEnabled } from "@/lib/app-settings";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import {
  getDashboardMineCounts,
  getDashboardMineTaskCounts,
  getDashboardOperationalCounts,
  getDashboardStandaloneTaskCounts,
  getDashboardTeamStandaloneTaskCounts,
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
  const appSettings = await getAppSettings();
  const inboxEnabled = isInboxEnabled(appSettings);
  const userId = profile?.userId ?? "";
  const teamScope = profile
    ? { role: profile.role, teamId: profile.teamId }
    : { role: "operator" as const, teamId: "" };

  const viewer = profile
    ? {
        userId: profile.userId,
        teamId: profile.teamId,
        role: profile.role,
      }
    : { userId: "", teamId: "", role: "operator" as const };

  const [
    counts,
    mineCounts,
    mineTaskCounts,
    mineStandaloneTaskCounts,
    teamStandaloneTaskCounts,
    activities,
    recentRequests,
    totalRequests,
  ] = await Promise.all([
    getDashboardOperationalCounts(teamScope),
    getDashboardMineCounts(userId, teamScope),
    getDashboardMineTaskCounts(userId, teamScope),
    getDashboardStandaloneTaskCounts(userId, teamScope),
    getDashboardTeamStandaloneTaskCounts(teamScope),
    getRecentActivitiesGlobal(teamScope, DASHBOARD_FEED_LIMIT),
    getRecentlyUpdatedRequests(teamScope, DASHBOARD_FEED_LIMIT),
    getRequestsTotalCount(teamScope),
  ]);

  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardHeader />
      <DashboardIdentity profile={profile} />

      {totalRequests === 0 ? (
        <AppEmptyState
          icon="queue"
          title="Nessun progetto"
          description={
            inboxEnabled
              ? "Crea il primo progetto o usa l'inbox per triage."
              : "Crea il primo progetto da Crea → Nuovo progetto."
          }
        >
          <Link href="/app/follow-up" className={uiLink}>
            Da seguire
          </Link>
        </AppEmptyState>
      ) : (
        <>
          <DashboardQueueOverview
            mineCounts={mineCounts}
            mineTaskCounts={mineTaskCounts}
            mineStandaloneTaskCounts={mineStandaloneTaskCounts}
            teamStandaloneTaskCounts={teamStandaloneTaskCounts}
            queueCounts={counts}
            teamScoped={teamScope.role !== "admin"}
            inboxEnabled={inboxEnabled}
          />
          <DashboardSecondaryFeed>
            <DashboardRecentActivities items={activities} viewer={viewer} />
            <DashboardRecentPanel items={recentRequests} viewer={viewer} />
          </DashboardSecondaryFeed>
        </>
      )}
    </div>
  );
}
