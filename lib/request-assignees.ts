import type { Request, RequestAssignee } from "@/types/request";

export function requestAssignedUserIds(
  request: Pick<Request, "assignees">,
): string[] {
  return request.assignees.map((a) => a.userId);
}

export function requestIsAssignedTo(
  request: Pick<Request, "assignees">,
  userId: string,
): boolean {
  if (!userId) return false;
  return request.assignees.some((a) => a.userId === userId);
}

export function requestHasAssignees(request: Pick<Request, "assignees">): boolean {
  return request.assignees.length > 0;
}

export function requestAssigneesLabel(
  request: Pick<Request, "assignees" | "assignedToLabel">,
): string | null {
  if (request.assignees.length === 0) return null;
  if (request.assignedToLabel) return request.assignedToLabel;
  return request.assignees.map((a) => a.label).join(", ");
}

export function formatAssigneeList(
  assignees: Pick<RequestAssignee, "label">[],
): string {
  if (assignees.length === 0) return "Nessuno";
  return assignees.map((a) => a.label).join(", ");
}

export function legacyAssigneeFieldsFromAssignees(
  assignees: RequestAssignee[],
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
