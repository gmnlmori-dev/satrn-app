import Link from "next/link";
import type { DashboardActivityItem } from "@/lib/supabase/dashboard-queries";
import { activityTypeLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { uiOverline } from "@/lib/typography";

export function DashboardRecentActivities({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="border-b border-slate-100/90 px-4 py-3.5 md:px-5 dark:border-slate-800">
        <p className={uiOverline}>Timeline</p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900 md:text-lg dark:text-slate-100">
          Attività recenti
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Ultime mosse registrate sulle richieste.
        </p>
      </div>
      <div className="flex-1 px-4 py-4 md:px-5 md:py-5">
        {items.length === 0 ? (
          <AppEmptyHint
            title="Ancora nessuna attività"
            description="Creazioni, aggiornamenti di stato e note appariranno qui man mano che lavori sulle richieste."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/app/requests/${a.requestId}`}
                  className={cn(
                    uiTransition,
                    uiFocusRingInset,
                    "group -mx-2 block rounded-lg px-2 py-3.5 first:pt-0 last:pb-0",
                    "hover:bg-slate-50/90 dark:hover:bg-slate-800/35",
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        uiOverline,
                        "text-[10px] tracking-[0.08em] text-slate-500 dark:text-slate-500",
                      )}
                    >
                      {activityTypeLabel[a.type]}
                    </span>
                    <time
                      dateTime={a.createdAt}
                      className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400"
                    >
                      {formatDateTime(a.createdAt)}
                    </time>
                  </div>
                  {a.requestTitle ? (
                    <p className="mt-1 truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                      {a.requestTitle}
                    </p>
                  ) : null}
                  <p className="mt-1.5 text-[15px] leading-snug text-slate-800 underline-offset-2 group-hover:underline dark:text-slate-200">
                    {a.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
