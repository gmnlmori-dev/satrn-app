import type { InboxItemStatus } from "@/types/inbox";
import { inboxStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";

const styles: Record<InboxItemStatus, string> = {
  new: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  reviewed: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  converted: "border-success/30 bg-success-muted text-success",
  archived: "border-border-default bg-inset text-muted",
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
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight",
        styles[status],
        className,
      )}
    >
      {inboxStatusLabel[status]}
    </span>
  );
}
