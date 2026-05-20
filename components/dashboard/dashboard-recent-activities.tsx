import Link from "next/link";
import type { DashboardActivityItem } from "@/lib/supabase/dashboard-queries";
import { activityTypeLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { uiCard } from "@/lib/surfaces";
import { uiCaption, uiMono, uiSectionTitle } from "@/lib/typography";

export function DashboardRecentActivities({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  return (
    <div className={cn(uiCard, "flex min-h-0 flex-col overflow-hidden")}>
      <div className="border-b border-line-default px-4 py-3 md:px-5">
        <h2 className={uiSectionTitle}>Timeline</h2>
        <p className="mt-1 text-sm text-fg-secondary">Ultime azioni sulle richieste.</p>
      </div>
      <div className="flex-1 p-4 md:p-5">
        {items.length === 0 ? (
          <AppEmptyHint title="Vuota" description="Le attività registrate compariranno qui." />
        ) : (
          <ul className="divide-y divide-line-default">
            {items.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/app/requests/${a.requestId}`}
                  className={cn(uiTransition, uiFocusRingInset, "group -mx-2 block rounded-[8px] px-2 py-3 hover:bg-elevated")}
                >
                  <div className="flex justify-between gap-2">
                    <span className={uiCaption}>{activityTypeLabel[a.type]}</span>
                    <time dateTime={a.createdAt} className={uiMono}>
                      {formatDateTime(a.createdAt)}
                    </time>
                  </div>
                  {a.requestTitle ? (
                    <p className="mt-0.5 truncate text-xs text-fg-tertiary">{a.requestTitle}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-fg-primary group-hover:text-accent">{a.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
