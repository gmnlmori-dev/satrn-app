import type { RequestPriority } from "@/types/request";
import { priorityLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<RequestPriority, string> = {
  high: "border-danger/30 bg-danger-muted text-danger",
  medium: "border-warning/30 bg-warning-muted text-warning",
  low: "border-border-default bg-inset text-muted",
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
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight",
        styles[priority],
        className,
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
