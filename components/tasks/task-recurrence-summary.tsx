import { formatTaskRecurrenceSummary } from "@/lib/task-recurrence";
import { cn } from "@/lib/cn";
import { uiCaption } from "@/lib/typography";
import type { TaskRecurrence } from "@/types/task";

export function TaskRecurrenceSummary({
  recurrence,
  className,
}: {
  recurrence: TaskRecurrence | null | undefined;
  className?: string;
}) {
  if (!recurrence) return null;
  return (
    <span className={cn(uiCaption, "text-fg-tertiary", className)}>
      Ripeti · {formatTaskRecurrenceSummary(recurrence)}
    </span>
  );
}
