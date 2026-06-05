import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import type { OpenTaskWindowCounts } from "@/lib/next-action-tasks";
import type { Task } from "@/types/task";

export type TaskDueWindow = "overdue" | "today" | "upcoming" | "none" | "nodue";

function taskDueMs(task: Pick<Task, "done" | "dueAt">): number | null {
  if (task.done || !task.dueAt) return null;
  const t = new Date(task.dueAt).getTime();
  return Number.isNaN(t) ? null : t;
}

export function classifyTaskDueWindow(
  task: Pick<Task, "done" | "dueAt">,
  bounds = getFollowUpWindowBounds(),
): TaskDueWindow {
  if (task.done) return "none";
  const dueMs = taskDueMs(task);
  if (dueMs === null) return "nodue";

  const startToday = new Date(bounds.startTodayIso).getTime();
  const startTomorrow = new Date(bounds.startTomorrowIso).getTime();
  const endWeek = new Date(bounds.endWeekIso).getTime();

  if (dueMs < startToday) return "overdue";
  if (dueMs < startTomorrow) return "today";
  if (dueMs <= endWeek) return "upcoming";
  return "none";
}

export function countTasksByWindow(
  tasks: Pick<Task, "done" | "dueAt">[],
  bounds = getFollowUpWindowBounds(),
): OpenTaskWindowCounts {
  const startToday = new Date(bounds.startTodayIso).getTime();
  const startTomorrow = new Date(bounds.startTomorrowIso).getTime();
  const endWeek = new Date(bounds.endWeekIso).getTime();

  let overdue = 0;
  let today = 0;
  let upcomingWeek = 0;
  let openTotal = 0;

  for (const task of tasks) {
    if (task.done) continue;
    openTotal += 1;
    const dueMs = taskDueMs(task);
    if (dueMs === null) continue;
    if (dueMs < startToday) overdue += 1;
    else if (dueMs < startTomorrow) today += 1;
    else if (dueMs <= endWeek) upcomingWeek += 1;
  }

  return { overdue, today, upcomingWeek, openTotal };
}

export function isStandaloneTaskOverdue(
  task: Pick<Task, "done" | "dueAt">,
  now: Date = new Date(),
): boolean {
  if (task.done || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < now.getTime();
}
