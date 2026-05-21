import Link from "next/link";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiBtnSecondary, uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { uiCard } from "@/lib/surfaces";
import { uiCaption, uiMono, uiSectionTitle } from "@/lib/typography";

export type DashboardFeedItem = {
  id: string;
  href: string;
  typeLabel: string;
  createdAt: string;
  contextLine?: string | null;
  body: string;
};

export function DashboardFeedCard({
  title,
  description,
  actionHref,
  actionLabel,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  items: DashboardFeedItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div className={cn(uiCard, "flex min-h-0 flex-col overflow-hidden")}>
      <div className="border-b border-line-default px-4 py-3 md:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className={uiSectionTitle}>{title}</h2>
            <p className="mt-1 text-sm text-fg-secondary">{description}</p>
          </div>
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className={cn(uiBtnSecondary, "shrink-0 px-2.5 py-1 text-xs")}
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-5">
        {items.length === 0 ? (
          <AppEmptyHint title={emptyTitle} description={emptyDescription} />
        ) : (
          <DashboardFeedList items={items} />
        )}
      </div>
    </div>
  );
}

export function DashboardFeedList({ items }: { items: DashboardFeedItem[] }) {
  return (
    <ul className="divide-y divide-line-default">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className={cn(
              uiTransition,
              uiFocusRingInset,
              "group -mx-2 block rounded-[8px] px-2 py-3 hover:bg-elevated",
            )}
          >
            <div className="flex justify-between gap-2">
              <span className={uiCaption}>{item.typeLabel}</span>
              <time dateTime={item.createdAt} className={uiMono}>
                {formatDateTime(item.createdAt)}
              </time>
            </div>
            {item.contextLine ? (
              <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                {item.contextLine}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-fg-primary group-hover:text-accent">
              {item.body}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
