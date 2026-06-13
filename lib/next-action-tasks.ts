import type { Request, RequestPriority } from "@/types/request";
import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";

export type NextActionTask = {
  id: string;
  text: string;
  done: boolean;
  dueAt: string | null;
};

export type NextActionContent = {
  text: string;
  tasks: NextActionTask[];
};

export type CalendarTaskEntry = {
  requestId: string;
  requestTitle: string;
  companyName: string;
  requestPriority: RequestPriority;
  nextActionAt: string | null;
  teamName: string | null;
  createdByLabel: string | null;
  assigneeUserIds: string[];
  /** Posizione nella checklist della richiesta (ordine di creazione). */
  taskIndex: number;
  task: NextActionTask;
};

type StoredTasksPayloadV1 = {
  v: 1;
  mode: "tasks";
  tasks: NextActionTask[];
};

type StoredPayloadV2 = {
  v: 2;
  text: string;
  tasks: NextActionTask[];
};

function newTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeDueAt(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : raw;
}

export function createNextActionTask(text = ""): NextActionTask {
  return { id: newTaskId(), text, done: false, dueAt: null };
}

function normalizeTasks(raw: unknown): NextActionTask[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const text = typeof o.text === "string" ? o.text : "";
      return {
        id: typeof o.id === "string" && o.id ? o.id : newTaskId(),
        text,
        done: Boolean(o.done),
        dueAt: normalizeDueAt(o.dueAt),
      } satisfies NextActionTask;
    })
    .filter((t): t is NextActionTask => t !== null);
}

export function parseNextAction(raw: string): NextActionContent {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { text: "", tasks: [] };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as StoredPayloadV2 | StoredTasksPayloadV1;
      if (parsed.v === 2) {
        return {
          text: typeof parsed.text === "string" ? parsed.text : "",
          tasks: normalizeTasks(parsed.tasks),
        };
      }
      if (parsed.v === 1 && parsed.mode === "tasks") {
        return {
          text: "",
          tasks: normalizeTasks(parsed.tasks),
        };
      }
    } catch {
      /* testo legacy o JSON non valido */
    }
  }

  return { text: raw, tasks: [] };
}

export function serializeNextAction(content: NextActionContent): string {
  const text = content.text.trim();
  const tasks = content.tasks
    .map((task) => ({ ...task, text: task.text.trim() }))
    .filter((task) => task.text.length > 0);

  if (!text && tasks.length === 0) return "";

  if (tasks.length === 0) return text;

  const payload: StoredPayloadV2 = {
    v: 2,
    text: content.text,
    tasks,
  };
  return JSON.stringify(payload);
}

export function patchNextActionTask(
  raw: string,
  taskId: string,
  patch: Partial<Pick<NextActionTask, "text" | "done" | "dueAt">>,
): string | null {
  const content = parseNextAction(raw);
  const index = content.tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return null;
  content.tasks[index] = { ...content.tasks[index], ...patch };
  return serializeNextAction(content);
}

/** Segna tutti i task checklist come completati (es. chiusura richiesta). */
export function markAllNextActionTasksDone(raw: string): {
  next: string;
  changed: boolean;
  completedCount: number;
} {
  const content = parseNextAction(raw);
  let changed = false;
  let completedCount = 0;
  const tasks = content.tasks.map((task) => {
    if (task.done) return task;
    changed = true;
    completedCount += 1;
    return { ...task, done: true };
  });

  if (!changed) {
    return { next: raw, changed: false, completedCount: 0 };
  }

  return {
    next: serializeNextAction({ ...content, tasks }),
    changed: true,
    completedCount,
  };
}

export function extractCalendarTasks(requests: Request[]): CalendarTaskEntry[] {
  const entries: CalendarTaskEntry[] = [];
  for (const request of requests) {
    if (request.status === "closed") continue;
    const content = parseNextAction(request.nextAction);
    for (const [taskIndex, task] of content.tasks.entries()) {
      if (task.done || !task.dueAt) continue;
      entries.push({
        requestId: request.id,
        requestTitle: request.title,
        companyName: request.companyName,
        requestPriority: request.priority,
        nextActionAt: request.nextActionAt,
        teamName: request.teamName,
        createdByLabel: request.createdByLabel,
        assigneeUserIds: request.assignees.map((assignee) => assignee.userId),
        taskIndex,
        task,
      });
    }
  }
  return entries;
}

export function isCalendarTaskOverdue(
  task: NextActionTask,
  now: Date = new Date(),
): boolean {
  if (task.done || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < now.getTime();
}

function formatTasksPreview(tasks: NextActionTask[]): string {
  const withText = tasks.filter((task) => task.text.trim());
  if (withText.length === 0) return "";

  const open = withText.filter((task) => !task.done);
  const first = (open[0] ?? withText[0]).text.trim();
  const remaining = withText.length - 1;
  if (remaining <= 0) return first;
  return `${first} (+${remaining})`;
}

export function formatNextActionPreview(raw: string): string {
  const content = parseNextAction(raw);
  const textPart = content.text.trim();
  const tasksPart = formatTasksPreview(content.tasks);

  if (textPart && tasksPart) return `${textPart} · ${tasksPart}`;
  return textPart || tasksPart;
}

export function nextActionSearchText(raw: string): string {
  const content = parseNextAction(raw);
  return [content.text, ...content.tasks.map((task) => task.text)]
    .join(" ")
    .trim();
}

export type OpenTaskWindowCounts = {
  overdue: number;
  today: number;
  upcomingWeek: number;
  openTotal: number;
};

function taskDueMs(task: NextActionTask): number | null {
  if (task.done || !task.dueAt) return null;
  const t = new Date(task.dueAt).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Conteggi task checklist aperti per finestra temporale (richieste assegnate). */
export function countOpenTasksByWindow(
  nextActionRaws: string[],
  bounds: {
    startTodayIso: string;
    startTomorrowIso: string;
    endWeekIso: string;
  },
): OpenTaskWindowCounts {
  const startToday = new Date(bounds.startTodayIso).getTime();
  const startTomorrow = new Date(bounds.startTomorrowIso).getTime();
  const endWeek = new Date(bounds.endWeekIso).getTime();

  let overdue = 0;
  let today = 0;
  let upcomingWeek = 0;
  let openTotal = 0;

  for (const raw of nextActionRaws) {
    const content = parseNextAction(raw);
    for (const task of content.tasks) {
      if (task.done) continue;
      openTotal += 1;
      const dueMs = taskDueMs(task);
      if (dueMs === null) continue;
      if (dueMs < startToday) overdue += 1;
      else if (dueMs < startTomorrow) today += 1;
      else if (dueMs <= endWeek) upcomingWeek += 1;
    }
  }

  return { overdue, today, upcomingWeek, openTotal };
}

export type NextActionTaskSummary = {
  open: number;
  total: number;
  overdue: number;
};

/** Conteggi task checklist su una singola richiesta (solo voci con testo). */
export function summarizeNextActionTasks(
  raw: string,
  bounds = getFollowUpWindowBounds(),
): NextActionTaskSummary {
  const content = parseNextAction(raw);
  const tasks = content.tasks.filter((task) => task.text.trim());
  const openTasks = tasks.filter((task) => !task.done);
  const startToday = new Date(bounds.startTodayIso).getTime();

  let overdue = 0;
  for (const task of openTasks) {
    const dueMs = taskDueMs(task);
    if (dueMs !== null && dueMs < startToday) overdue += 1;
  }

  return {
    open: openTasks.length,
    total: tasks.length,
    overdue,
  };
}

export type FollowUpChecklistWindow = "overdue" | "today" | "upcoming";

/** Checklist con scadenza nella finestra temporale di Da seguire. */
export function filterCalendarTasksByWindow(
  entries: CalendarTaskEntry[],
  window: FollowUpChecklistWindow,
  bounds = getFollowUpWindowBounds(),
): CalendarTaskEntry[] {
  const startToday = new Date(bounds.startTodayIso).getTime();
  const startTomorrow = new Date(bounds.startTomorrowIso).getTime();
  const endWeek = new Date(bounds.endWeekIso).getTime();

  return entries.filter(({ task }) => {
    if (task.done || !task.dueAt) return false;
    const dueMs = new Date(task.dueAt).getTime();
    if (Number.isNaN(dueMs)) return false;
    if (window === "overdue") return dueMs < startToday;
    if (window === "today") return dueMs >= startToday && dueMs < startTomorrow;
    return dueMs >= startTomorrow && dueMs <= endWeek;
  });
}

/** Checklist la cui richiesta non è già nella coda per scadenza generale. */
export function orphanChecklistEntriesForRequests(
  entries: CalendarTaskEntry[],
  requestsInQueue: Pick<Request, "id">[],
): CalendarTaskEntry[] {
  const requestIds = new Set(requestsInQueue.map((request) => request.id));
  return entries.filter((entry) => !requestIds.has(entry.requestId));
}

function checklistTaskIndex(
  task: NextActionTask,
  sourceOrder: NextActionTask[],
): number {
  const index = sourceOrder.findIndex((item) => item.id === task.id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/** Ordine checklist in Da seguire: scadenza propria, altrimenti ordine in richiesta. */
export function sortChecklistTasksForFollowUp(
  tasks: NextActionTask[],
  sourceOrder: NextActionTask[],
  bounds = getFollowUpWindowBounds(),
): NextActionTask[] {
  const startToday = new Date(bounds.startTodayIso).getTime();

  return [...tasks].sort((a, b) => {
    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : null;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : null;
    const aOverdue = aDue !== null && aDue < startToday;
    const bOverdue = bDue !== null && bDue < startToday;

    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
    if (aDue !== null && bDue === null) return -1;
    if (aDue === null && bDue !== null) return 1;
    return (
      checklistTaskIndex(a, sourceOrder) - checklistTaskIndex(b, sourceOrder)
    );
  });
}

export function sortChecklistEntriesForRequest(
  entries: CalendarTaskEntry[],
): CalendarTaskEntry[] {
  return [...entries].sort((a, b) => {
    const aDue = a.task.dueAt ? new Date(a.task.dueAt).getTime() : null;
    const bDue = b.task.dueAt ? new Date(b.task.dueAt).getTime() : null;
    if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
    return a.taskIndex - b.taskIndex;
  });
}

export function sortCalendarTaskEntries(
  entries: CalendarTaskEntry[],
): CalendarTaskEntry[] {
  return [...entries].sort((a, b) => {
    const aDue = a.task.dueAt ? new Date(a.task.dueAt).getTime() : 0;
    const bDue = b.task.dueAt ? new Date(b.task.dueAt).getTime() : 0;
    if (aDue !== bDue) return aDue - bDue;
    if (a.requestId !== b.requestId) {
      return a.requestTitle.localeCompare(b.requestTitle, "it");
    }
    return a.taskIndex - b.taskIndex;
  });
}
