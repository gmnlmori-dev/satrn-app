import type { RequestStatus } from "@/types/request";
import { statusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<RequestStatus, string> = {
  new: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  in_review: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  waiting: "border-warning/30 bg-warning-muted text-warning",
  follow_up: "border-success/30 bg-success-muted text-success",
  closed: "border-border-default bg-inset text-muted",
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
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight",
        styles[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
