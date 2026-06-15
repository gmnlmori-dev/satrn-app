import { cn } from "@/lib/cn";
import { formatDateTime, isRequestOverdue } from "@/lib/date";
import { followUpRequestDeadlineLines } from "@/lib/follow-up-request-deadline";
import type { Request } from "@/types/request";

export function RequestFollowUpDeadlines({
  request,
  status,
}: {
  request: Pick<Request, "nextActionAt" | "nextAction">;
  status: Request["status"];
}) {
  const lines = followUpRequestDeadlineLines(request);

  if (lines.length === 0) {
    return <span className="text-xs text-fg-tertiary">Senza scadenza</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {lines.map((line) => {
        const overdue = isRequestOverdue(line.iso, status);
        return (
          <span key={`${line.label}-${line.iso}`} className="inline-flex items-baseline gap-1">
            <time
              dateTime={line.iso}
              className={cn(
                "text-xs tabular-nums",
                overdue ? "font-medium text-danger" : "text-fg-tertiary",
              )}
            >
              {formatDateTime(line.iso)}
            </time>
            <span className="text-[11px] text-fg-tertiary">{line.label}</span>
          </span>
        );
      })}
    </div>
  );
}
