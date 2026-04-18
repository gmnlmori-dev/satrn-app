import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardOperationalStrip } from "@/components/dashboard/dashboard-operational-strip";
import { DashboardRecentActivities } from "@/components/dashboard/dashboard-recent-activities";
import { DashboardRecentPanel } from "@/components/dashboard/dashboard-panels";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import {
  getDashboardOperationalCounts,
  getRecentActivitiesGlobal,
  getRecentlyUpdatedRequests,
  getRequestsTotalCount,
} from "@/lib/supabase/dashboard-queries";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";

export default async function DashboardPage() {
  const [
    counts,
    activities,
    recentRequests,
    totalRequests,
  ] = await Promise.all([
    getDashboardOperationalCounts(),
    getRecentActivitiesGlobal(10),
    getRecentlyUpdatedRequests(6),
    getRequestsTotalCount(),
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
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
              "rounded-md text-sm font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-200",
            )}
          >
            Apri Da seguire
          </Link>
          <Link
            href="/app/inbox"
            className={cn(
              uiTransition,
              uiFocusRingOffset,
              "rounded-md text-sm font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-200",
            )}
          >
            Vai all&apos;inbox
          </Link>
        </AppEmptyState>
      ) : null}

      <DashboardOperationalStrip counts={counts} />

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
        <DashboardRecentActivities items={activities} />
        <DashboardRecentPanel items={recentRequests} />
      </div>
    </div>
  );
}
