import type { CalendarTaskEntry } from "@/lib/next-action-tasks";
import type { Task } from "@/types/task";
import type { Request } from "@/types/request";

export type CalendarStandaloneTaskEntry = {
  kind: "standalone-task";
  task: Task;
};

export type CalendarRequestChecklistEntry = {
  kind: "request-checklist";
  entry: CalendarTaskEntry;
};

export type CalendarRequestDeadlineEntry = {
  kind: "request-deadline";
  request: Request;
};

export type CalendarDayEntry =
  | CalendarRequestDeadlineEntry
  | CalendarRequestChecklistEntry
  | CalendarStandaloneTaskEntry;

export function extractStandaloneCalendarTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.done && task.dueAt);
}
