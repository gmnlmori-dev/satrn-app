"use client";

import { useEffect, useMemo, useState } from "react";
import { fromDateAndTimeInputs } from "@/lib/date";
import { cn } from "@/lib/cn";
import {
  buildRecurrenceForSave,
  defaultRecurrenceDraft,
  endOfLocalDayIsoFromDateInput,
  formatTaskRecurrenceSummary,
  type TaskRecurrenceDraft,
  WEEKDAY_SHORT,
} from "@/lib/task-recurrence";
import { uiControl, uiDateControl } from "@/lib/ui-classes";
import { uiCaption, uiFormLabel } from "@/lib/typography";
import type { TaskRecurrence } from "@/types/task";

const FREQUENCY_OPTIONS: { value: TaskRecurrence["frequency"]; label: string }[] = [
  { value: "daily", label: "giorno" },
  { value: "weekly", label: "settimana" },
  { value: "monthly", label: "mese" },
  { value: "yearly", label: "anno" },
];

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"] as const;

type EndMode = TaskRecurrence["end"]["type"];

function draftFromRecurrence(rule: TaskRecurrence): TaskRecurrenceDraft {
  return {
    interval: rule.interval,
    frequency: rule.frequency,
    weekdays: rule.weekdays,
    monthlyBy: rule.monthlyBy,
    end: rule.end,
  };
}

export function TaskRecurrenceFields({
  idPrefix,
  dueDate,
  dueTime,
  disabled = false,
  initialRecurrence = null,
}: {
  idPrefix: string;
  dueDate: string;
  dueTime: string;
  disabled?: boolean;
  initialRecurrence?: TaskRecurrence | null;
}) {
  const dueIso = fromDateAndTimeInputs(dueDate, dueTime);
  const hasDueDate = Boolean(dueDate.trim());

  const [enabled, setEnabled] = useState(Boolean(initialRecurrence));
  const [draft, setDraft] = useState<TaskRecurrenceDraft>(() =>
    initialRecurrence
      ? draftFromRecurrence(initialRecurrence)
      : defaultRecurrenceDraft(dueIso ?? new Date().toISOString()),
  );
  const [endMode, setEndMode] = useState<EndMode>(
    () => initialRecurrence?.end.type ?? "never",
  );
  const [untilDate, setUntilDate] = useState(() => {
    if (initialRecurrence?.end.type === "until") {
      return initialRecurrence.end.until.slice(0, 10);
    }
    return dueDate;
  });
  const [occurrenceCount, setOccurrenceCount] = useState(() => {
    if (initialRecurrence?.end.type === "count") {
      return initialRecurrence.end.count;
    }
    return 30;
  });

  useEffect(() => {
    if (!enabled || !dueIso) return;
    setDraft((prev) => {
      if (prev.frequency === "weekly" && (!prev.weekdays || prev.weekdays.length === 0)) {
        return defaultRecurrenceDraft(dueIso, "weekly");
      }
      if (prev.frequency === "monthly" && !prev.monthlyBy) {
        return defaultRecurrenceDraft(dueIso, "monthly");
      }
      return prev;
    });
  }, [dueIso, enabled]);

  const endValue = useMemo((): TaskRecurrence["end"] => {
    if (endMode === "until") {
      const until =
        endOfLocalDayIsoFromDateInput(untilDate) ??
        endOfLocalDayIsoFromDateInput(dueDate) ??
        new Date().toISOString();
      return { type: "until", until };
    }
    if (endMode === "count") {
      return { type: "count", count: Math.max(1, occurrenceCount) };
    }
    return { type: "never" };
  }, [dueDate, endMode, occurrenceCount, untilDate]);

  const draftWithEnd: TaskRecurrenceDraft = useMemo(
    () => ({ ...draft, end: endValue }),
    [draft, endValue],
  );

  const serializedRule = useMemo(() => {
    if (!enabled || !dueIso) return "";
    return JSON.stringify(buildRecurrenceForSave(draftWithEnd, dueIso, 0));
  }, [draftWithEnd, dueIso, enabled]);

  const summary = useMemo(() => {
    if (!enabled || !dueIso) return null;
    return formatTaskRecurrenceSummary(buildRecurrenceForSave(draftWithEnd, dueIso, 0));
  }, [draftWithEnd, dueIso, enabled]);

  function setFrequency(frequency: TaskRecurrence["frequency"]) {
    if (!dueIso) return;
    const base = defaultRecurrenceDraft(dueIso, frequency);
    setDraft((prev) => ({
      ...base,
      interval: prev.interval,
      end: prev.end,
    }));
  }

  function toggleWeekday(day: number) {
    setDraft((prev) => {
      const current = prev.weekdays ?? [];
      const next = current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b);
      return { ...prev, weekdays: next.length > 0 ? next : [day] };
    });
  }

  return (
    <div className="rounded-lg border border-line-default bg-elevated/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={uiFormLabel}>Ripeti</span>
          <p className={cn(uiCaption, "mt-1")}>
            {hasDueDate
              ? "Alla chiusura la task si riprogramma automaticamente."
              : "Imposta una scadenza per abilitare la ripetizione."}
          </p>
        </div>
        <label className="inline-flex shrink-0 items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            disabled={disabled || !hasDueDate}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-line-default accent-accent"
          />
          <span className="sr-only">Abilita ripetizione</span>
        </label>
      </div>

      <input type="hidden" name="recurrenceEnabled" value={enabled && hasDueDate ? "1" : "0"} />
      <input type="hidden" name="recurrenceJson" value={serializedRule} readOnly />

      {enabled && hasDueDate ? (
        <div className="mt-4 space-y-4">
          <div>
            <span className={uiFormLabel}>Si ripete ogni</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                id={`${idPrefix}-recurrence-interval`}
                type="number"
                min={1}
                max={999}
                value={draft.interval}
                disabled={disabled}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    interval: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                className={cn(uiControl, "w-20 py-2 text-center tabular-nums")}
              />
              <select
                id={`${idPrefix}-recurrence-frequency`}
                value={draft.frequency}
                disabled={disabled}
                onChange={(e) =>
                  setFrequency(e.target.value as TaskRecurrence["frequency"])
                }
                className={cn(uiControl, "min-w-[9rem] py-2")}
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {draft.frequency === "weekly" ? (
            <div>
              <span className={uiFormLabel}>Giorni</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = draft.weekdays?.includes(index) ?? false;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      title={WEEKDAY_SHORT[index]}
                      onClick={() => toggleWeekday(index)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold",
                        active
                          ? "border-accent/40 bg-accent-muted text-accent"
                          : "border-line-default bg-surface text-fg-secondary hover:bg-elevated",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {draft.frequency === "monthly" ? (
            <div className="space-y-2">
              <span className={uiFormLabel}>Ogni mese</span>
              <div className="mt-1.5 space-y-2">
                <label className="flex items-center gap-2 text-sm text-fg-secondary">
                  <input
                    type="radio"
                    name={`${idPrefix}-monthly-mode`}
                    checked={draft.monthlyBy?.mode !== "nthWeekday"}
                    disabled={disabled}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        monthlyBy: {
                          mode: "dayOfMonth",
                          day: dueIso ? new Date(dueIso).getDate() : 1,
                        },
                      }))
                    }
                  />
                  <span>Giorno</span>
                  <select
                    value={
                      draft.monthlyBy?.mode === "dayOfMonth"
                        ? draft.monthlyBy.day
                        : dueIso
                          ? new Date(dueIso).getDate()
                          : 1
                    }
                    disabled={disabled || draft.monthlyBy?.mode === "nthWeekday"}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        monthlyBy: {
                          mode: "dayOfMonth",
                          day: Number(e.target.value),
                        },
                      }))
                    }
                    className={cn(uiControl, "w-20 py-1.5")}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
                  <input
                    type="radio"
                    name={`${idPrefix}-monthly-mode`}
                    checked={draft.monthlyBy?.mode === "nthWeekday"}
                    disabled={disabled}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        monthlyBy: {
                          mode: "nthWeekday",
                          nth: 1,
                          weekday: dueIso ? ((new Date(dueIso).getDay() + 6) % 7) : 0,
                        },
                      }))
                    }
                  />
                  <select
                    value={
                      draft.monthlyBy?.mode === "nthWeekday" ? draft.monthlyBy.nth : 1
                    }
                    disabled={disabled || draft.monthlyBy?.mode !== "nthWeekday"}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        monthlyBy: {
                          mode: "nthWeekday",
                          nth: Number(e.target.value) as 1 | 2 | 3 | 4 | -1,
                          weekday:
                            prev.monthlyBy?.mode === "nthWeekday"
                              ? prev.monthlyBy.weekday
                              : 0,
                        },
                      }))
                    }
                    className={cn(uiControl, "w-24 py-1.5")}
                  >
                    <option value={1}>1°</option>
                    <option value={2}>2°</option>
                    <option value={3}>3°</option>
                    <option value={4}>4°</option>
                    <option value={-1}>Ultimo</option>
                  </select>
                  <select
                    value={
                      draft.monthlyBy?.mode === "nthWeekday"
                        ? draft.monthlyBy.weekday
                        : 0
                    }
                    disabled={disabled || draft.monthlyBy?.mode !== "nthWeekday"}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        monthlyBy: {
                          mode: "nthWeekday",
                          nth:
                            prev.monthlyBy?.mode === "nthWeekday"
                              ? prev.monthlyBy.nth
                              : 1,
                          weekday: Number(e.target.value),
                        },
                      }))
                    }
                    className={cn(uiControl, "min-w-[7rem] py-1.5")}
                  >
                    {WEEKDAY_SHORT.map((label, index) => (
                      <option key={label} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <div>
            <span className={uiFormLabel}>Fine</span>
            <div className="mt-1.5 space-y-2">
              <label className="flex items-center gap-2 text-sm text-fg-secondary">
                <input
                  type="radio"
                  name={`${idPrefix}-recurrence-end`}
                  checked={endMode === "never"}
                  disabled={disabled}
                  onChange={() => setEndMode("never")}
                />
                Mai
              </label>
              <label className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
                <input
                  type="radio"
                  name={`${idPrefix}-recurrence-end`}
                  checked={endMode === "until"}
                  disabled={disabled}
                  onChange={() => setEndMode("until")}
                />
                Il
                <input
                  type="date"
                  value={untilDate}
                  disabled={disabled || endMode !== "until"}
                  onChange={(e) => setUntilDate(e.target.value)}
                  className={cn(uiDateControl, "py-1.5")}
                />
              </label>
              <label className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
                <input
                  type="radio"
                  name={`${idPrefix}-recurrence-end`}
                  checked={endMode === "count"}
                  disabled={disabled}
                  onChange={() => setEndMode("count")}
                />
                Dopo
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={occurrenceCount}
                  disabled={disabled || endMode !== "count"}
                  onChange={(e) =>
                    setOccurrenceCount(Math.max(1, Number(e.target.value) || 1))
                  }
                  className={cn(uiControl, "w-20 py-1.5 text-center tabular-nums")}
                />
                occorrenze
              </label>
            </div>
          </div>

          {summary ? (
            <p className={cn(uiCaption, "border-t border-line-default/70 pt-3")}>{summary}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
