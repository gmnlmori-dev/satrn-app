export type NextActionTask = {
  id: string;
  text: string;
  done: boolean;
};

export type NextActionContent =
  | { mode: "text"; text: string; tasks: NextActionTask[] }
  | { mode: "tasks"; text: string; tasks: NextActionTask[] };

type StoredTasksPayload = {
  v: 1;
  mode: "tasks";
  tasks: NextActionTask[];
};

function newTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createNextActionTask(text = ""): NextActionTask {
  return { id: newTaskId(), text, done: false };
}

function normalizeTasks(raw: unknown): NextActionTask[] {
  if (!Array.isArray(raw)) return [createNextActionTask()];
  const tasks = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const text = typeof o.text === "string" ? o.text : "";
      return {
        id: typeof o.id === "string" && o.id ? o.id : newTaskId(),
        text,
        done: Boolean(o.done),
      } satisfies NextActionTask;
    })
    .filter((t): t is NextActionTask => t !== null);
  return tasks.length > 0 ? tasks : [createNextActionTask()];
}

export function parseNextAction(raw: string): NextActionContent {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { mode: "text", text: "", tasks: [createNextActionTask()] };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as StoredTasksPayload;
      if (parsed.v === 1 && parsed.mode === "tasks") {
        return {
          mode: "tasks",
          text: "",
          tasks: normalizeTasks(parsed.tasks),
        };
      }
    } catch {
      /* testo legacy o JSON non valido */
    }
  }

  return {
    mode: "text",
    text: raw,
    tasks: linesToTasks(raw),
  };
}

function linesToTasks(text: string): NextActionTask[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [createNextActionTask()];
  return lines.map((line) => createNextActionTask(line));
}

export function serializeNextAction(content: NextActionContent): string {
  if (content.mode === "text") {
    return content.text.trim();
  }

  const tasks = content.tasks
    .map((task) => ({ ...task, text: task.text.trim() }))
    .filter((task) => task.text.length > 0);

  if (tasks.length === 0) return "";

  const payload: StoredTasksPayload = {
    v: 1,
    mode: "tasks",
    tasks,
  };
  return JSON.stringify(payload);
}

export function switchNextActionMode(
  content: NextActionContent,
  mode: NextActionContent["mode"],
): NextActionContent {
  if (content.mode === mode) return content;

  if (mode === "tasks") {
    const fromText = content.mode === "text" ? content.text : "";
    return {
      mode: "tasks",
      text: "",
      tasks: linesToTasks(fromText),
    };
  }

  const joined = content.tasks
    .map((task) => task.text.trim())
    .filter(Boolean)
    .join("\n");
  return {
    mode: "text",
    text: joined,
    tasks: linesToTasks(joined),
  };
}

export function formatNextActionPreview(raw: string): string {
  const content = parseNextAction(raw);
  if (content.mode === "text") {
    return content.text.trim();
  }

  const tasks = content.tasks.filter((task) => task.text.trim());
  if (tasks.length === 0) return "";

  const open = tasks.filter((task) => !task.done);
  const first = (open[0] ?? tasks[0]).text.trim();
  const remaining = tasks.length - 1;
  if (remaining <= 0) return first;
  return `${first} (+${remaining})`;
}

export function nextActionSearchText(raw: string): string {
  const content = parseNextAction(raw);
  if (content.mode === "text") return content.text;
  return content.tasks.map((task) => task.text).join(" ");
}
