import type { InboxItem } from "@/types/inbox";

export function inboxCreatorUserId(item: Pick<InboxItem, "createdByUserId" | "assignedUserId">): string | null {
  return item.createdByUserId ?? item.assignedUserId;
}

export function canDeleteInboxItem(
  item: Pick<
    InboxItem,
    "createdByUserId" | "assignedUserId" | "linkedRequestId" | "status"
  >,
  userId: string,
): boolean {
  if (!userId) return false;
  if (item.linkedRequestId) return false;
  if (item.status === "converted") return false;
  const creatorId = inboxCreatorUserId(item);
  return creatorId === userId;
}
