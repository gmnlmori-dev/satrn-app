export type TaskRecurrenceEnd =
  | { type: "never" }
  | { type: "until"; until: string }
  | { type: "count"; count: number };

export type TaskRecurrenceMonthlyBy =
  | { mode: "dayOfMonth"; day: number }
  | { mode: "nthWeekday"; nth: 1 | 2 | 3 | 4 | -1; weekday: number };

export type TaskRecurrence = {
  interval: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  weekdays?: number[];
  monthlyBy?: TaskRecurrenceMonthlyBy;
  startAt: string;
  end: TaskRecurrenceEnd;
  completedCount: number;
};

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
  recurrence: TaskRecurrence | null;
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
