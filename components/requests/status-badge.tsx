import type { RequestStatus } from "@/types/request";
import { statusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<RequestStatus, string> = {
  new: "border-accent/50 bg-accent-subtle text-accent",
  in_review: "border-line-strong bg-elevated text-fg-primary",
  waiting: "border-warning/40 bg-warning-muted text-warning",
  follow_up: "border-success/40 bg-success-muted text-success",
  closed: "border-line-default bg-field text-fg-tertiary",
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
        "inline-flex shrink-0 items-center rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
        styles[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
