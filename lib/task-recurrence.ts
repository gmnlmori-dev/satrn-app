import { RRule } from "rrule";
import type {
  Task,
  TaskRecurrence,
  TaskRecurrenceEnd,
  TaskRecurrenceMonthlyBy,
} from "@/types/task";
import { endOfLocalDayFromDateInput, toDateInputValue } from "@/lib/date";

const RRULE_WEEKDAYS = [
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
  RRule.SU,
] as const;

const WEEKDAY_SHORT = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] as const;

const FREQUENCY_LABELS: Record<TaskRecurrence["frequency"], string> = {
  daily: "giorno",
  weekly: "settimana",
  monthly: "mese",
  yearly: "anno",
};

const NTH_LABELS: Record<1 | 2 | 3 | 4 | -1, string> = {
  1: "1°",
  2: "2°",
  3: "3°",
  4: "4°",
  [-1]: "ultimo",
};

export type TaskRecurrenceDraft = Omit<TaskRecurrence, "startAt" | "completedCount">;

export function weekdayFromIso(iso: string): number {
  const d = new Date(iso);
  return (d.getDay() + 6) % 7;
}

export function defaultRecurrenceDraft(
  dueAt: string,
  frequency: TaskRecurrence["frequency"] = "weekly",
): TaskRecurrenceDraft {
  const weekday = weekdayFromIso(dueAt);
  const dayOfMonth = new Date(dueAt).getDate();
  return {
    interval: 1,
    frequency,
    weekdays: frequency === "weekly" ? [weekday] : undefined,
    monthlyBy:
      frequency === "monthly"
        ? { mode: "dayOfMonth", day: dayOfMonth }
        : undefined,
    end: { type: "never" },
  };
}

function parseEnd(raw: unknown): TaskRecurrenceEnd | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.type === "never") return { type: "never" };
  if (o.type === "until" && typeof o.until === "string" && o.until.trim()) {
    return { type: "until", until: o.until.trim() };
  }
  if (o.type === "count" && typeof o.count === "number" && o.count >= 1) {
    return { type: "count", count: Math.floor(o.count) };
  }
  return null;
}

function parseMonthlyBy(raw: unknown): TaskRecurrenceMonthlyBy | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.mode === "dayOfMonth" && typeof o.day === "number") {
    const day = Math.floor(o.day);
    if (day >= 1 && day <= 31) return { mode: "dayOfMonth", day };
  }
  if (o.mode === "nthWeekday" && typeof o.weekday === "number") {
    const nth = o.nth;
    if (nth === 1 || nth === 2 || nth === 3 || nth === 4 || nth === -1) {
      const weekday = Math.floor(o.weekday);
      if (weekday >= 0 && weekday <= 6) {
        return { mode: "nthWeekday", nth, weekday };
      }
    }
  }
  return null;
}

export function parseTaskRecurrence(raw: unknown): TaskRecurrence | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return parseTaskRecurrence(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return null;

  const o = raw as Record<string, unknown>;
  const frequency = o.frequency;
  if (
    frequency !== "daily" &&
    frequency !== "weekly" &&
    frequency !== "monthly" &&
    frequency !== "yearly"
  ) {
    return null;
  }

  const interval =
    typeof o.interval === "number" && o.interval >= 1
      ? Math.floor(o.interval)
      : null;
  if (!interval) return null;

  if (typeof o.startAt !== "string" || !o.startAt.trim()) return null;
  const startAt = o.startAt.trim();
  if (Number.isNaN(new Date(startAt).getTime())) return null;

  const end = parseEnd(o.end);
  if (!end) return null;

  const completedCount =
    typeof o.completedCount === "number" && o.completedCount >= 0
      ? Math.floor(o.completedCount)
      : 0;

  let weekdays: number[] | undefined;
  if (Array.isArray(o.weekdays)) {
    weekdays = [
      ...new Set(
        o.weekdays
          .map((value) => (typeof value === "number" ? Math.floor(value) : NaN))
          .filter((value) => value >= 0 && value <= 6),
      ),
    ].sort((a, b) => a - b);
  }

  let monthlyBy: TaskRecurrenceMonthlyBy | undefined;
  if (o.monthlyBy != null) {
    const parsed = parseMonthlyBy(o.monthlyBy);
    if (!parsed) return null;
    monthlyBy = parsed;
  }

  if (frequency === "weekly" && (!weekdays || weekdays.length === 0)) {
    weekdays = [weekdayFromIso(startAt)];
  }

  if (frequency === "monthly" && !monthlyBy) {
    monthlyBy = { mode: "dayOfMonth", day: new Date(startAt).getDate() };
  }

  return {
    interval,
    frequency,
    weekdays: frequency === "weekly" ? weekdays : undefined,
    monthlyBy: frequency === "monthly" ? monthlyBy : undefined,
    startAt,
    end,
    completedCount,
  };
}

export function validateTaskRecurrence(
  rule: TaskRecurrence,
  dueAt: string | null,
): string | null {
  if (!dueAt) {
    return "Per una task ricorrente serve una scadenza.";
  }
  if (rule.interval < 1) {
    return "L'intervallo di ripetizione deve essere almeno 1.";
  }
  if (rule.frequency === "weekly") {
    if (!rule.weekdays?.length) {
      return "Seleziona almeno un giorno della settimana.";
    }
  }
  if (rule.frequency === "monthly" && !rule.monthlyBy) {
    return "Imposta la ripetizione mensile.";
  }
  if (rule.end.type === "count" && rule.end.count < 1) {
    return "Il numero di occorrenze deve essere almeno 1.";
  }
  if (rule.end.type === "until") {
    const untilMs = new Date(rule.end.until).getTime();
    if (Number.isNaN(untilMs)) {
      return "La data di fine non è valida.";
    }
  }
  return null;
}

function buildRRuleOptions(rule: TaskRecurrence): ConstructorParameters<typeof RRule>[0] {
  const dtstart = new Date(rule.startAt);
  const freq = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  }[rule.frequency];

  const options: ConstructorParameters<typeof RRule>[0] = {
    freq,
    interval: rule.interval,
    dtstart,
  };

  if (rule.frequency === "weekly" && rule.weekdays?.length) {
    options.byweekday = rule.weekdays.map((day) => RRULE_WEEKDAYS[day]);
  }

  if (rule.frequency === "monthly" && rule.monthlyBy) {
    if (rule.monthlyBy.mode === "dayOfMonth") {
      options.bymonthday = rule.monthlyBy.day;
    } else {
      const weekday = RRULE_WEEKDAYS[rule.monthlyBy.weekday];
      if (rule.monthlyBy.nth === -1) {
        options.byweekday = weekday;
        options.bysetpos = -1;
      } else {
        options.byweekday = weekday.nth(rule.monthlyBy.nth);
      }
    }
  }

  if (rule.end.type === "until") {
    options.until = new Date(rule.end.until);
  }

  return options;
}

export function computeNextDueAt(
  rule: TaskRecurrence,
  currentDueAt: string,
): string | null {
  const current = new Date(currentDueAt);
  if (Number.isNaN(current.getTime())) return null;

  const rrule = new RRule(buildRRuleOptions(rule));
  const next = rrule.after(current, false);
  if (!next || Number.isNaN(next.getTime())) return null;
  return next.toISOString();
}

export function isRecurrenceSeriesEnded(
  rule: TaskRecurrence,
  nextDueAt: string | null,
): boolean {
  if (nextDueAt === null) return true;
  if (rule.end.type === "count" && rule.completedCount >= rule.end.count) {
    return true;
  }
  if (rule.end.type === "until") {
    const nextMs = new Date(nextDueAt).getTime();
    const untilMs = new Date(rule.end.until).getTime();
    if (!Number.isNaN(untilMs) && nextMs > untilMs) return true;
  }
  return false;
}

export function recurrenceSeriesEndedAfterComplete(
  rule: TaskRecurrence,
  nextDueAt: string | null,
): boolean {
  const withCount = { ...rule, completedCount: rule.completedCount + 1 };
  if (withCount.end.type === "count" && withCount.completedCount >= withCount.end.count) {
    return true;
  }
  return isRecurrenceSeriesEnded(withCount, nextDueAt);
}

export function buildRecurrenceForSave(
  draft: TaskRecurrenceDraft,
  dueAt: string,
  completedCount = 0,
): TaskRecurrence {
  const base = defaultRecurrenceDraft(dueAt, draft.frequency);
  return {
    interval: draft.interval,
    frequency: draft.frequency,
    weekdays:
      draft.frequency === "weekly"
        ? (draft.weekdays?.length ? draft.weekdays : base.weekdays)
        : undefined,
    monthlyBy:
      draft.frequency === "monthly"
        ? (draft.monthlyBy ?? base.monthlyBy)
        : undefined,
    startAt: dueAt,
    end: draft.end,
    completedCount,
  };
}

export function recurrenceFromFormData(
  fd: FormData,
  dueAt: string | null,
  previous: TaskRecurrence | null = null,
): TaskRecurrence | null {
  const enabled = String(fd.get("recurrenceEnabled") ?? "") === "1";
  if (!enabled) return null;

  const raw = String(fd.get("recurrenceJson") ?? "").trim();
  const parsed = parseTaskRecurrence(raw);
  if (!parsed || !dueAt) return null;

  const next = buildRecurrenceForSave(parsed, dueAt, previous?.completedCount ?? 0);
  const err = validateTaskRecurrence(next, dueAt);
  if (err) return null;
  return next;
}

export function recurrenceRulesEqual(a: TaskRecurrence, b: TaskRecurrence): boolean {
  return (
    a.interval === b.interval &&
    a.frequency === b.frequency &&
    JSON.stringify(a.weekdays ?? []) === JSON.stringify(b.weekdays ?? []) &&
    JSON.stringify(a.monthlyBy ?? null) === JSON.stringify(b.monthlyBy ?? null) &&
    JSON.stringify(a.end) === JSON.stringify(b.end)
  );
}

export function formatTaskRecurrenceSummary(rule: TaskRecurrence): string {
  const unit =
    rule.interval === 1
      ? FREQUENCY_LABELS[rule.frequency]
      : `${rule.interval} ${FREQUENCY_LABELS[rule.frequency]}i`;

  let cadence = `Ogni ${unit}`;

  if (rule.frequency === "weekly" && rule.weekdays?.length) {
    const days = rule.weekdays.map((d) => WEEKDAY_SHORT[d]).join(", ");
    cadence += ` · ${days}`;
  }

  if (rule.frequency === "monthly" && rule.monthlyBy) {
    if (rule.monthlyBy.mode === "dayOfMonth") {
      cadence += ` · giorno ${rule.monthlyBy.day}`;
    } else {
      cadence += ` · ${NTH_LABELS[rule.monthlyBy.nth]} ${WEEKDAY_SHORT[rule.monthlyBy.weekday]}`;
    }
  }

  if (rule.end.type === "until") {
    cadence += ` · fino al ${toDateInputValue(rule.end.until).split("-").reverse().join("/")}`;
  } else if (rule.end.type === "count") {
    cadence += ` · ${rule.end.count} volte`;
  }

  return cadence;
}

export function endOfLocalDayIsoFromDateInput(date: string): string | null {
  return endOfLocalDayFromDateInput(date);
}

export { WEEKDAY_SHORT, FREQUENCY_LABELS, NTH_LABELS };

export function applyTaskToggleResult(
  task: Task,
  result: {
    done: boolean;
    dueAt: string | null;
    completedAt: string | null;
    recurrence: TaskRecurrence | null;
  },
): Task {
  return {
    ...task,
    done: result.done,
    dueAt: result.dueAt,
    completedAt: result.completedAt,
    recurrence: result.recurrence,
  };
}
