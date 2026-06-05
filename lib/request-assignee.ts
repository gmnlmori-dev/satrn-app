import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";
import type { Task } from "@/types/task";
import type { AppRole } from "@/types/profile";
import {
  requestHasAssignees,
  requestIsAssignedTo,
} from "@/lib/request-assignees";
import { taskIsAssignedTo } from "@/lib/task-assignees";

export type FollowUpAssigneeScope = "all" | "mine";

export function filterRequestsMine(
  requests: Request[],
  userId: string,
): Request[] {
  if (!userId) return [];
  return requests.filter((r) => requestIsAssignedTo(r, userId));
}

export function filterInboxMine(items: InboxItem[], userId: string): InboxItem[] {
  if (!userId) return [];
  return items.filter((i) => i.assignedUserId === userId);
}

export function filterTasksMine(tasks: Task[], userId: string): Task[] {
  if (!userId) return [];
  return tasks.filter((t) => taskIsAssignedTo(t, userId));
}

/** Default vista Da seguire: operator sul proprio carico, admin/manager su tutta la coda. */
export function defaultFollowUpAssigneeScope(role: AppRole): FollowUpAssigneeScope {
  return role === "operator" ? "mine" : "all";
}

export { requestHasAssignees, requestIsAssignedTo };