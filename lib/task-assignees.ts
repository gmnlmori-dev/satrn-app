import type { Task, TaskAssignee } from "@/types/task";

export function taskAssignedUserIds(task: Pick<Task, "assignees">): string[] {
  return task.assignees.map((a) => a.userId);
}

export function taskIsAssignedTo(
  task: Pick<Task, "assignees">,
  userId: string,
): boolean {
  if (!userId) return false;
  return task.assignees.some((a) => a.userId === userId);
}

export function taskHasAssignees(task: Pick<Task, "assignees">): boolean {
  return task.assignees.length > 0;
}

export function taskAssigneesLabel(
  task: Pick<Task, "assignees" | "assignedToLabel">,
): string | null {
  if (task.assignees.length === 0) return null;
  if (task.assignedToLabel) return task.assignedToLabel;
  return task.assignees.map((a) => a.label).join(", ");
}

export function formatTaskAssigneeList(
  assignees: Pick<TaskAssignee, "label">[],
): string {
  if (assignees.length === 0) return "Nessuno";
  return assignees.map((a) => a.label).join(", ");
}

export function legacyTaskAssigneeFieldsFromAssignees(
  assignees: TaskAssignee[],
): {
  assignedUserId: string | null;
  assignedAt: string | null;
  assignedToLabel: string | null;
} {
  if (assignees.length === 0) {
    return {
      assignedUserId: null,
      assignedAt: null,
      assignedToLabel: null,
    };
  }
  const sorted = [...assignees].sort(
    (a, b) =>
      new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
  );
  const labels = assignees.map((a) => a.label).filter(Boolean);
  return {
    assignedUserId: sorted[0]?.userId ?? null,
    assignedAt: sorted[0]?.assignedAt ?? null,
    assignedToLabel: labels.length > 0 ? labels.join(", ") : null,
  };
}
