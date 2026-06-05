export type TaskAssignee = {
  userId: string;
  label: string;
  assignedAt: string;
};

export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignees: TaskAssignee[];
  assignedUserId: string | null;
  assignedAt: string | null;
  assignedToLabel: string | null;
  teamId: string;
  teamName: string | null;
  createdByUserId: string;
  createdByLabel: string | null;
}
