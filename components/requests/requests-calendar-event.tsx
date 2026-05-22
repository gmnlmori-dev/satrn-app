import type { Request, RequestPriority } from "@/types/request";
import { cn } from "@/lib/cn";
import { formatTime, isRequestOverdue } from "@/lib/date";
import { uiTransition } from "@/lib/ui-classes";

const priorityBar: Record<RequestPriority, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-fg-tertiary",
};

const eventShellClass = (
  overdue: boolean,
  compact?: boolean,
) =>
  cn(
    uiTransition,
    "flex min-w-0 w-full items-stretch overflow-hidden rounded-[6px] border text-left",
    overdue
      ? "border-danger/50 bg-danger-muted/40 hover:bg-danger-muted/60"
      : "border-line-default bg-elevated hover:bg-surface",
    compact ? "text-[11px]" : "text-xs",
  );

function EventContent({
  request,
  compact,
  overdue,
}: {
  request: Request;
  compact?: boolean;
  overdue: boolean;
}) {
  return (
    <>
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
    </>
  );
}

export function RequestsCalendarEvent({
  request,
  compact,
  onSelect,
}: {
  request: Request;
  compact?: boolean;
  onSelect?: (request: Request) => void;
}) {
  const overdue = Boolean(
    request.nextActionAt &&
      isRequestOverdue(request.nextActionAt, request.status),
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(request);
        }}
        className={eventShellClass(overdue, compact)}
        aria-label={`Anteprima richiesta: ${request.title}`}
      >
        <EventContent request={request} compact={compact} overdue={overdue} />
      </button>
    );
  }

  return (
    <div className={eventShellClass(overdue, compact)}>
      <EventContent request={request} compact={compact} overdue={overdue} />
    </div>
  );
}
