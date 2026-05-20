import type { InboxItemStatus } from "@/types/inbox";
import { inboxStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<InboxItemStatus, string> = {
  new: "border-accent/50 bg-accent-subtle text-accent",
  reviewed: "border-line-strong bg-elevated text-fg-primary",
  converted: "border-success/40 bg-success-muted text-success",
  archived: "border-line-default bg-field text-fg-tertiary",
};

export function InboxStatusBadge({
  status,
  className,
}: {
  status: InboxItemStatus;
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
      {inboxStatusLabel[status]}
    </span>
  );
}
