import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { uiCard } from "@/lib/surfaces";

const iconWrap = cn(
  "mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] border border-line-default bg-field text-fg-tertiary",
);

function IconInbox() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 6.75l4.5 4.5L20.25 4.5M20.25 4.5v4.5h-4.5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
    </svg>
  );
}

function IconTask() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export type AppEmptyStateIcon =
  | "inbox"
  | "queue"
  | "search"
  | "activity"
  | "calendar"
  | "task"
  | "none";

function renderIcon(kind: AppEmptyStateIcon) {
  switch (kind) {
    case "none":
      return null;
    case "queue":
      return <IconQueue />;
    case "search":
      return <IconSearch />;
    case "activity":
      return <IconActivity />;
    case "calendar":
      return <IconCalendar />;
    case "task":
      return <IconTask />;
    default:
      return <IconInbox />;
  }
}

export function AppEmptyState({
  title,
  description,
  icon = "inbox",
  children,
  compact,
  className,
}: {
  title: string;
  description: ReactNode;
  icon?: AppEmptyStateIcon;
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const showIcon = icon !== "none";
  return (
    <div
      className={cn(
        uiCard,
        "flex flex-col items-center justify-center border-dashed text-center",
        compact ? "px-4 py-8" : "px-6 py-10",
        className,
      )}
    >
      {showIcon ? <div className={iconWrap}>{renderIcon(icon)}</div> : null}
      <p className="text-[15px] font-medium text-fg-primary">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-secondary">
        {description}
      </p>
      {children ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function AppEmptyHint({
  title,
  description,
  className,
}: {
  title: string;
  description: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-dashed border-line-default bg-field px-4 py-5 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-fg-primary">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-tertiary">{description}</p>
    </div>
  );
}
