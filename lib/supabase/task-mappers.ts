import { legacyTaskAssigneeFieldsFromAssignees } from "@/lib/task-assignees";
import type { TaskRowWithAssignee } from "@/types/database";
import type { Task, TaskAssignee } from "@/types/task";

function assigneeDisplayName(
  a: { full_name?: string | null; email?: string | null } | null | undefined,
): string | null {
  if (!a) return null;
  const name = (a.full_name ?? "").trim();
  if (name) return name;
  const mail = (a.email ?? "").trim();
  return mail || null;
}

function profileDisplayName(
  p: TaskRowWithAssignee["creator"],
): string | null {
  if (!p) return null;
  const name = (p.full_name ?? "").trim();
  if (name) return name;
  const mail = (p.email ?? "").trim();
  return mail || null;
}

function mapTaskAssignees(row: TaskRowWithAssignee): TaskAssignee[] {
  const junction = row.task_assignees ?? [];
  return junction
    .map((entry) => ({
      userId: entry.user_id,
      label: assigneeDisplayName(entry.assignee) ?? entry.user_id,
      assignedAt: entry.assigned_at,
    }))
    .sort(
      (a, b) =>
        new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
    );
}

export function taskRowToTask(row: TaskRowWithAssignee): Task {
  const assignees = mapTaskAssignees(row);
  const legacy = legacyTaskAssigneeFieldsFromAssignees(assignees);

  return {
    id: row.id,
    title: row.title,
    done: row.done,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignees,
    assignedUserId: legacy.assignedUserId,
    assignedAt: legacy.assignedAt,
    assignedToLabel: legacy.assignedToLabel,
    teamId: row.team_id,
    teamName: row.team?.name?.trim() || null,
    createdByUserId: row.created_by_user_id,
    createdByLabel: profileDisplayName(row.creator),
  };
}
