import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardOperationalStrip } from "@/components/dashboard/dashboard-operational-strip";
import { DashboardRecentActivities } from "@/components/dashboard/dashboard-recent-activities";
import { DashboardRecentPanel } from "@/components/dashboard/dashboard-panels";
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
        <div className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40 sm:px-6">
          <p className="text-[15px] font-medium text-slate-800 dark:text-slate-200">
            Nessuna richiesta nel database
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Crea la prima dalla scrivania o dal menu laterale. Puoi comunque
            usare l&apos;inbox per raccogliere ingressi grezzi.
          </p>
          <Link
            href="/app/requests"
            className={cn(
              uiTransition,
              uiFocusRingOffset,
              "mt-5 inline-block rounded-md text-sm font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-200",
            )}
          >
            Vai alle richieste
          </Link>
        </div>
      ) : null}

      <DashboardOperationalStrip counts={counts} />

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
        <DashboardRecentActivities items={activities} />
        <DashboardRecentPanel items={recentRequests} />
      </div>
    </div>
  );
}
