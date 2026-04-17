import type { RequestStatus } from "@/types/request";
import { statusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<RequestStatus, string> = {
  new:
    "bg-sky-50 text-sky-800 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800",
  in_review:
    "bg-violet-50 text-violet-800 ring-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800",
  waiting:
    "bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800",
  follow_up:
    "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800",
  closed:
    "bg-slate-100 text-slate-600 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-tight ring-1 ring-inset",
        styles[status],
        className
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
