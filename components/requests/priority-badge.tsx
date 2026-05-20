import type { RequestPriority } from "@/types/request";
import { priorityLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<RequestPriority, string> = {
  high: "border-danger/40 bg-danger-muted text-danger",
  medium: "border-warning/40 bg-warning-muted text-warning",
  low: "border-line-default bg-field text-fg-tertiary",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: RequestPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
        styles[priority],
        className,
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
