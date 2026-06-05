import {
  taskHasAssignees,
  taskIsAssignedTo,
} from "@/lib/task-assignees";
import type { AssignScopeFilter } from "@/lib/requests-query";
import type { Task } from "@/types/task";

export type TaskStatusFilter = "open" | "done" | "all";

export type TaskToolbarFilters = {
  search: string;
  status: TaskStatusFilter;
  assignScope: AssignScopeFilter;
  assignUserId: string;
};

export const defaultTaskToolbarFilters = (
  assignScope: AssignScopeFilter = "all",
): TaskToolbarFilters => ({
  search: "",
  status: "open",
  assignScope,
  assignUserId: "",
});

export function filterTasksByAssignScope(
  tasks: Task[],
  assignScope: AssignScopeFilter,
  assignUserId: string,
  ctx: { currentUserId: string },
): Task[] {
  switch (assignScope) {
    case "mine":
      if (!ctx.currentUserId) return [];
      return tasks.filter((t) => taskIsAssignedTo(t, ctx.currentUserId));
    case "unassigned":
      return tasks.filter((t) => !taskHasAssignees(t));
    case "user":
      if (!assignUserId) return tasks;
      return tasks.filter((t) => taskIsAssignedTo(t, assignUserId));
    default:
      return tasks;
  }
}

export function filterTasksByToolbar(
  tasks: Task[],
  filters: TaskToolbarFilters,
  ctx: { currentUserId: string },
): Task[] {
  let result = filterTasksByAssignScope(
    tasks,
    filters.assignScope,
    filters.assignUserId,
    ctx,
  );

  if (filters.status === "open") {
    result = result.filter((t) => !t.done);
  } else if (filters.status === "done") {
    result = result.filter((t) => t.done);
  }

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter((t) => t.title.toLowerCase().includes(q));
  }

  return result;
}
