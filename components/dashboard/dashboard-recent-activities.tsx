import Link from "next/link";
import type { DashboardActivityItem } from "@/lib/supabase/dashboard-queries";
import { activityTypeLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { uiMono, uiOverline } from "@/lib/typography";
import { uiPanel } from "@/lib/surfaces";

export function DashboardRecentActivities({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  return (
    <div className={cn(uiPanel, "flex min-h-0 flex-col overflow-hidden")}>
      <div className="border-b border-border-subtle px-4 py-3.5 md:px-5">
        <p className={uiOverline}>Timeline</p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-primary md:text-lg">
          Attività recenti
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-secondary">
          Ultime mosse registrate sulle richieste.
        </p>
      </div>
      <div className="flex-1 px-4 py-4 md:px-5 md:py-5">
        {items.length === 0 ? (
          <AppEmptyHint
            title="Ancora nessuna attività"
            description="Creazioni, aggiornamenti di stato e note appariranno qui."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {items.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/app/requests/${a.requestId}`}
                  className={cn(
                    uiTransition,
                    uiFocusRingInset,
                    "group -mx-2 block rounded-lg px-2 py-3 first:pt-0 last:pb-0 hover:bg-panel-hover",
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className={cn(uiOverline, "text-[10px]")}>
                      {activityTypeLabel[a.type]}
                    </span>
                    <time dateTime={a.createdAt} className={cn(uiMono, "text-xs")}>
                      {formatDateTime(a.createdAt)}
                    </time>
                  </div>
                  {a.requestTitle ? (
                    <p className="mt-1 truncate text-xs text-muted">{a.requestTitle}</p>
                  ) : null}
                  <p className="mt-1.5 text-sm leading-snug text-primary underline-offset-2 group-hover:underline">
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
