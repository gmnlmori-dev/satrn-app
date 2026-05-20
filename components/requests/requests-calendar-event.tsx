import Link from "next/link";
import type { Request, RequestPriority } from "@/types/request";
import { cn } from "@/lib/cn";
import { formatTime, isRequestOverdue } from "@/lib/date";
import { uiTransition } from "@/lib/ui-classes";

const priorityBar: Record<RequestPriority, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-fg-tertiary",
};

export function RequestsCalendarEvent({
  request,
  compact,
}: {
  request: Request;
  compact?: boolean;
}) {
  const overdue =
    request.nextActionAt &&
    isRequestOverdue(request.nextActionAt, request.status);

  return (
    <Link
      href={`/app/requests/${request.id}`}
      className={cn(
        uiTransition,
        "flex min-w-0 items-stretch overflow-hidden rounded-[6px] border text-left",
        overdue
          ? "border-danger/50 bg-danger-muted/40 hover:bg-danger-muted/60"
          : "border-line-default bg-elevated hover:bg-surface",
        compact ? "text-[11px]" : "text-xs",
      )}
    >
      <span
        className={cn("w-1 shrink-0", priorityBar[request.priority])}
        aria-hidden
      />
      <span className="min-w-0 flex-1 px-1.5 py-0.5">
        <span className="block truncate font-medium text-fg-primary">
          {request.title}
        </span>
        {request.nextActionAt ? (
          <span
            className={cn(
              "tabular-nums",
              overdue ? "text-danger" : "text-fg-tertiary",
            )}
          >
            {formatTime(request.nextActionAt)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
