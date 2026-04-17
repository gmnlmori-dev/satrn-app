import type { RequestPriority } from "@/types/request";
import { priorityLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<RequestPriority, string> = {
  high: "bg-rose-50 text-rose-800 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900",
  medium:
    "bg-orange-50 text-orange-900 ring-orange-200/80 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-900",
  low: "bg-slate-50 text-slate-700 ring-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600",
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
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-tight ring-1 ring-inset",
        styles[priority],
        className
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
