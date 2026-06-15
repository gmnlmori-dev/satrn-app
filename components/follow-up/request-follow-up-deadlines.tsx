import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, isEndOfLocalDayIso, isRequestOverdue } from "@/lib/date";
import {
  followUpRequestDeadlineLines,
  type FollowUpDeadlineLine,
} from "@/lib/follow-up-request-deadline";
import type { Request } from "@/types/request";

function formatDeadlineDisplay(iso: string): string {
  if (isEndOfLocalDayIso(iso)) return formatDate(iso);
  return formatDateTime(iso);
}

function deadlineChipClass(
  line: FollowUpDeadlineLine,
  overdue: boolean,
): string {
  if (overdue) {
    return "border-danger/35 bg-danger-muted/40";
  }
  if (line.kind === "checklist") {
    return "border-line-default/90 bg-canvas/80";
  }
  if (line.kind === "next_action") {
    return "border-accent/20 bg-accent-muted/30";
  }
  return "border-line-default/90 bg-elevated/60";
}

export function RequestFollowUpDeadlines({
  request,
  status,
}: {
  request: Pick<Request, "nextActionAt" | "nextAction">;
  status: Request["status"];
}) {
  const lines = followUpRequestDeadlineLines(request);

  if (lines.length === 0) {
    return (
      <span className="text-[11px] text-fg-tertiary">Senza scadenza</span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lines.map((line) => {
        const overdue = isRequestOverdue(line.iso, status);
        return (
          <span
            key={`${line.kind}-${line.iso}`}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-[6px] border px-2 py-1",
              deadlineChipClass(line, overdue),
            )}
          >
            <span className="shrink-0 text-[10px] font-medium text-fg-tertiary">
              {line.label}
            </span>
            <span
              className="h-3 w-px shrink-0 bg-line-default/70"
              aria-hidden
            />
            <time
              dateTime={line.iso}
              className={cn(
                "min-w-0 truncate text-[11px] tabular-nums leading-none",
                overdue
                  ? "font-semibold text-danger"
                  : "font-medium text-fg-primary",
              )}
            >
              {formatDeadlineDisplay(line.iso)}
            </time>
          </span>
        );
      })}
    </div>
  );
}
