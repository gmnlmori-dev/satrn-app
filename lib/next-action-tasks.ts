import type { Request, RequestPriority } from "@/types/request";

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
  requestPriority: RequestPriority;
  teamName: string | null;
  createdByLabel: string | null;
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

export function extractCalendarTasks(requests: Request[]): CalendarTaskEntry[] {
  const entries: CalendarTaskEntry[] = [];
  for (const request of requests) {
    if (request.status === "closed") continue;
    const content = parseNextAction(request.nextAction);
    for (const task of content.tasks) {
      if (task.done || !task.dueAt) continue;
      entries.push({
        requestId: request.id,
        requestTitle: request.title,
        requestPriority: request.priority,
        teamName: request.teamName,
        createdByLabel: request.createdByLabel,
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
