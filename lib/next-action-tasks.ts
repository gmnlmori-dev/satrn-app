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
  /** Posizione nella checklist del progetto (ordine di creazione). */
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

/** Segna tutti i task checklist come completati (es. chiusura progetto). */
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
        nextActionAt: effectiveNextActionAt(request),
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

/** Scadenza checklist aperta più urgente (la più in ritardo = data più antica). */
export function earliestOpenChecklistDueAt(nextActionRaw: string): string | null {
  const content = parseNextAction(nextActionRaw);
  let earliestMs: number | null = null;
  let earliestIso: string | null = null;

  for (const task of content.tasks) {
    const dueMs = taskDueMs(task);
    if (dueMs === null) continue;
    if (earliestMs === null || dueMs < earliestMs) {
      earliestMs = dueMs;
      earliestIso = task.dueAt;
    }
  }

  return earliestIso;
}

/** Imposta la stessa scadenza a tutti i task checklist aperti che ne hanno una. */
export function shiftOpenChecklistDueDatesTo(
  raw: string,
  newDueAt: string,
): string {
  const content = parseNextAction(raw);
  let changed = false;
  const tasks = content.tasks.map((task) => {
    if (task.done || !task.dueAt) return task;
    if (task.dueAt === newDueAt) return task;
    changed = true;
    return { ...task, dueAt: newDueAt };
  });
  if (!changed) return raw;
  return serializeNextAction({ ...content, tasks });
}

type RequestDeadlineSource = Pick<Request, "nextActionAt" | "nextAction">;

function earliestDueIso(candidates: (string | null)[]): string | null {
  let earliestMs: number | null = null;
  let earliestIso: string | null = null;

  for (const iso of candidates) {
    if (!iso) continue;
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) continue;
    if (earliestMs === null || ms < earliestMs) {
      earliestMs = ms;
      earliestIso = iso;
    }
  }

  return earliestIso;
}

/**
 * Scadenza operativa: la più in ritardo tra `nextActionAt` e checklist aperte
 * (data più antica = più urgente).
 */
export function effectiveNextActionAt(request: RequestDeadlineSource): string | null {
  return earliestDueIso([
    request.nextActionAt,
    earliestOpenChecklistDueAt(request.nextAction),
  ]);
}

export function effectiveNextActionAtMs(request: RequestDeadlineSource): number | null {
  const iso = effectiveNextActionAt(request);
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export type FollowUpChecklistWindow = "overdue" | "today" | "upcoming";

function requestInFollowUpWindow(
  request: Request,
  window: FollowUpChecklistWindow,
  bounds: ReturnType<typeof getFollowUpWindowBounds>,
): boolean {
  if (request.status === "closed") return false;
  const dueMs = effectiveNextActionAtMs(request);
  if (dueMs === null) return false;

  const startToday = new Date(bounds.startTodayIso).getTime();
  const startTomorrow = new Date(bounds.startTomorrowIso).getTime();
  const endWeek = new Date(bounds.endWeekIso).getTime();

  if (window === "overdue") return dueMs < startToday;
  if (window === "today") return dueMs >= startToday && dueMs < startTomorrow;
  return dueMs >= startTomorrow && dueMs <= endWeek;
}

/** Progetti aperti nella finestra temporale di Da seguire (scadenza effettiva). */
export function filterRequestsByFollowUpWindow(
  requests: Request[],
  window: FollowUpChecklistWindow,
  bounds = getFollowUpWindowBounds(),
): Request[] {
  return requests
    .filter((request) => requestInFollowUpWindow(request, window, bounds))
    .sort((a, b) => {
      const ta = effectiveNextActionAtMs(a) ?? Number.MAX_SAFE_INTEGER;
      const tb = effectiveNextActionAtMs(b) ?? Number.MAX_SAFE_INTEGER;
      if (ta !== tb) return ta - tb;
      return a.title.localeCompare(b.title, "it");
    });
}

export function countRequestsInFollowUpWindow(
  requests: Request[],
  window: FollowUpChecklistWindow,
  bounds = getFollowUpWindowBounds(),
): number {
  return filterRequestsByFollowUpWindow(requests, window, bounds).length;
}

/** Conteggi task checklist aperti per finestra temporale (progetti assegnati). */
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

/** Conteggi task checklist su un singolo progetto (solo voci con testo). */
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

/** Checklist il cui progetto non è già nella coda per scadenza generale. */
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

type ChecklistSortItem = {
  dueAt: string | null;
  taskIndex: number;
};

type ChecklistSortMode = "followUp" | "requestGroup" | "calendar";

function dueAtTime(dueAt: string | null): number | null {
  if (!dueAt) return null;
  const t = new Date(dueAt).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Comparatore unificato: ritardo → scadenza → indice (→ titolo progetto in modalità calendar). */
export function compareChecklistSortItems(
  a: ChecklistSortItem,
  b: ChecklistSortItem,
  mode: ChecklistSortMode,
  options?: {
    startTodayMs?: number;
    requestTitleA?: string;
    requestTitleB?: string;
    requestIdA?: string;
    requestIdB?: string;
  },
): number {
  const aDue = dueAtTime(a.dueAt);
  const bDue = dueAtTime(b.dueAt);

  if (mode === "followUp" || mode === "requestGroup") {
    const startToday = options?.startTodayMs ?? 0;
    const aOverdue = aDue !== null && aDue < startToday;
    const bOverdue = bDue !== null && bDue < startToday;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
  }

  if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
  if (aDue !== null && bDue === null) return -1;
  if (aDue === null && bDue !== null) return 1;

  if (mode === "calendar") {
    const idA = options?.requestIdA ?? "";
    const idB = options?.requestIdB ?? "";
    if (idA !== idB) {
      const titleA = options?.requestTitleA ?? "";
      const titleB = options?.requestTitleB ?? "";
      return titleA.localeCompare(titleB, "it");
    }
  }

  return a.taskIndex - b.taskIndex;
}

/** Ordine checklist in Da seguire: ritardo → scadenza → ordine in progetto. */
export function sortChecklistTasksForFollowUp(
  tasks: NextActionTask[],
  sourceOrder: NextActionTask[],
  bounds = getFollowUpWindowBounds(),
): NextActionTask[] {
  const startTodayMs = new Date(bounds.startTodayIso).getTime();

  return [...tasks].sort((a, b) =>
    compareChecklistSortItems(
      {
        dueAt: a.dueAt,
        taskIndex: checklistTaskIndex(a, sourceOrder),
      },
      {
        dueAt: b.dueAt,
        taskIndex: checklistTaskIndex(b, sourceOrder),
      },
      "followUp",
      { startTodayMs },
    ),
  );
}

export function sortChecklistEntriesForRequest(
  entries: CalendarTaskEntry[],
  bounds = getFollowUpWindowBounds(),
): CalendarTaskEntry[] {
  const startTodayMs = new Date(bounds.startTodayIso).getTime();

  return [...entries].sort((a, b) =>
    compareChecklistSortItems(
      { dueAt: a.task.dueAt, taskIndex: a.taskIndex },
      { dueAt: b.task.dueAt, taskIndex: b.taskIndex },
      "requestGroup",
      { startTodayMs },
    ),
  );
}

export function sortCalendarTaskEntries(
  entries: CalendarTaskEntry[],
): CalendarTaskEntry[] {
  return [...entries].sort((a, b) =>
    compareChecklistSortItems(
      { dueAt: a.task.dueAt, taskIndex: a.taskIndex },
      { dueAt: b.task.dueAt, taskIndex: b.taskIndex },
      "calendar",
      {
        requestIdA: a.requestId,
        requestIdB: b.requestId,
        requestTitleA: a.requestTitle,
        requestTitleB: b.requestTitle,
      },
    ),
  );
}
