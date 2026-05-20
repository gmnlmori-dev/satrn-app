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
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfileSummary();
  const userId = profile?.userId ?? "";

  const [counts, mineCounts, activities, recentRequests, totalRequests] =
    await Promise.all([
      getDashboardOperationalCounts(),
      getDashboardMineCounts(userId),
      getRecentActivitiesGlobal(10),
      getRecentlyUpdatedRequests(6),
      getRequestsTotalCount(),
    ]);

  return (
    <div className="space-y-6 md:space-y-7">
      <DashboardHeader />

      {totalRequests === 0 ? (
        <AppEmptyState
          icon="queue"
          title="Nessuna richiesta in coda"
          description="Aggiungi la prima da Crea → Nuova richiesta nella barra laterale. Per messaggi o appunti non ancora strutturati usa Crea → Nuovo inbox."
        >
          <Link
            href="/app/follow-up"
            className={cn(
              uiTransition,
              uiFocusRingOffset,
              "rounded-md text-sm font-semibold text-accent underline-offset-2 hover:underline",
            )}
          >
            Apri Da seguire
          </Link>
          <Link
            href="/app/inbox"
            className={cn(
              uiTransition,
              uiFocusRingOffset,
              "rounded-md text-sm font-semibold text-accent underline-offset-2 hover:underline",
            )}
          >
            Vai all&apos;inbox
          </Link>
        </AppEmptyState>
      ) : null}

      {mineCounts ? <DashboardMyWorkStrip counts={mineCounts} /> : null}

      <DashboardOperationalStrip counts={counts} />

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
        <DashboardRecentActivities items={activities} />
        <DashboardRecentPanel items={recentRequests} />
      </div>
    </div>
  );
}
