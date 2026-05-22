import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";
import type { AppRole } from "@/types/profile";

export type FollowUpAssigneeScope = "all" | "mine";

export function filterRequestsMine(
  requests: Request[],
  userId: string,
): Request[] {
  if (!userId) return [];
  return requests.filter((r) => r.assignedUserId === userId);
}

export function filterInboxMine(items: InboxItem[], userId: string): InboxItem[] {
  if (!userId) return [];
  return items.filter((i) => i.assignedUserId === userId);
}

/** Default vista Da seguire: operator sul proprio carico, admin/manager su tutta la coda. */
export function defaultFollowUpAssigneeScope(role: AppRole): FollowUpAssigneeScope {
  return role === "operator" ? "mine" : "all";
}
