import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMetricStrip } from "@/components/dashboard/dashboard-metric-strip";
import {
  DashboardRecentPanel,
  DashboardTodayPanel,
} from "@/components/dashboard/dashboard-panels";
import {
  computeDashboardStats,
  getFollowUpToday,
  getRecentRequests,
} from "@/lib/dashboard-stats";
import { getRequests } from "@/lib/supabase/queries";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";

export default async function DashboardPage() {
  const requests = await getRequests();
  const stats = computeDashboardStats(requests);
  const recent = getRecentRequests(requests, 6);
  const today = getFollowUpToday(requests);

  return (
    <div className="space-y-5 md:space-y-6">
      <DashboardHeader />

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40 sm:px-6">
          <p className="text-[15px] font-medium text-slate-800 dark:text-slate-200">
            Nessuna richiesta nel database
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Crea la prima dalla scrivania o dal menu laterale.
          </p>
          <Link
            href="/app/requests"
            className={cn(
              uiTransition,
              uiFocusRingOffset,
              "mt-5 inline-block rounded-md text-sm font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-200"
            )}
          >
            Vai alle richieste
          </Link>
        </div>
      ) : null}

      <DashboardMetricStrip stats={stats} />

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
        <DashboardTodayPanel items={today} />
        <DashboardRecentPanel items={recent} />
      </div>
    </div>
  );
}
