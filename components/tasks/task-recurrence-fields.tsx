"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fromDateAndTimeInputs,
  todayDateInputValue,
} from "@/lib/date";
import { cn } from "@/lib/cn";
import {
  buildRecurrenceForSave,
  defaultRecurrenceDraft,
  endOfLocalDayIsoFromDateInput,
  formatTaskSchedulePreview,
  nthWeekdayFromIso,
  syncRecurrenceDraftWithDueAt,
  type TaskRecurrenceDraft,
  weekdayFromIso,
  WEEKDAY_SHORT,
} from "@/lib/task-recurrence";
import { uiBtnSecondary, uiControl, uiDateControl } from "@/lib/ui-classes";
import { uiCaption, uiFilterLabel, uiFormLabel } from "@/lib/typography";
import type { TaskRecurrence } from "@/types/task";

const FREQUENCY_OPTIONS: {
  value: TaskRecurrence["frequency"];
  label: string;
}[] = [
  { value: "daily", label: "Giornaliera" },
  { value: "weekly", label: "Settimanale" },
  { value: "monthly", label: "Mensile" },
  { value: "yearly", label: "Annuale" },
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

export function TaskScheduleFields({
  idPrefix,
  dueDate,
  dueTime,
  onDueDateChange,
  onDueTimeChange,
  disabled = false,
  initialRecurrence = null,
}: {
  idPrefix: string;
  dueDate: string;
  dueTime: string;
  onDueDateChange: (value: string) => void;
  onDueTimeChange: (value: string) => void;
  disabled?: boolean;
  initialRecurrence?: TaskRecurrence | null;
}) {
  const dueIso = fromDateAndTimeInputs(dueDate, dueTime);
  const hasDueDate = Boolean(dueDate.trim());
  const anchorWeekday = dueIso != null ? weekdayFromIso(dueIso) : null;

  const [repeatEnabled, setRepeatEnabled] = useState(Boolean(initialRecurrence));
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
    if (!repeatEnabled || !dueIso) return;
    setDraft((prev) => syncRecurrenceDraftWithDueAt(prev, dueIso));
  }, [dueIso, repeatEnabled]);

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

  const draftWithEnd = useMemo(
    () =>
      dueIso
        ? syncRecurrenceDraftWithDueAt({ ...draft, end: endValue }, dueIso)
        : { ...draft, end: endValue },
    [draft, dueIso, endValue],
  );

  const serializedRule = useMemo(() => {
    if (!repeatEnabled || !dueIso) return "";
    return JSON.stringify(buildRecurrenceForSave(draftWithEnd, dueIso, 0));
  }, [draftWithEnd, dueIso, repeatEnabled]);

  const preview = useMemo(() => {
    if (!repeatEnabled || !dueIso) return null;
    return formatTaskSchedulePreview(dueIso, draftWithEnd);
  }, [draftWithEnd, dueIso, repeatEnabled]);

  function handleRepeatToggle(checked: boolean) {
    setRepeatEnabled(checked);
    if (checked && !dueDate.trim()) {
      onDueDateChange(todayDateInputValue());
    }
    if (checked && dueIso) {
      setDraft(defaultRecurrenceDraft(dueIso, draft.frequency));
    }
  }

  function setFrequency(frequency: TaskRecurrence["frequency"]) {
    if (!dueIso) return;
    setDraft((prev) =>
      syncRecurrenceDraftWithDueAt(
        {
          ...defaultRecurrenceDraft(dueIso, frequency),
          interval: prev.interval,
          end: prev.end,
        },
        dueIso,
      ),
    );
  }

  function toggleWeekday(day: number) {
    if (anchorWeekday != null && day === anchorWeekday) return;
    if (!dueIso) return;
    setDraft((prev) => {
      const current = prev.weekdays ?? [];
      const next = current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b);
      return syncRecurrenceDraftWithDueAt(
        { ...prev, weekdays: next.length > 0 ? next : current },
        dueIso,
      );
    });
  }

  const control = cn(uiDateControl, "py-2.5 text-[15px]");

  return (
    <div className="rounded-lg border border-line-default bg-elevated/40 p-4">
      <div>
        <span className={uiFormLabel}>
          {repeatEnabled ? "Prima scadenza" : "Scadenza"}{" "}
          <span className="text-sm font-normal text-fg-tertiary">
            {repeatEnabled ? "(obbligatoria)" : "(opzionale)"}
          </span>
        </span>
        <p className={cn(uiCaption, "mt-1")}>
          {repeatEnabled
            ? "Data e ora della prossima occorrenza; le ripetizioni partono da qui."
            : "Solo data: fine giornata. L'ora è facoltativa."}
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 sm:max-w-[12rem]">
            <label htmlFor={`${idPrefix}-date`} className={uiFilterLabel}>
              Data
            </label>
            <input
              id={`${idPrefix}-date`}
              type="date"
              disabled={disabled}
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              className={cn(control, "mt-1")}
            />
          </div>
          <div className="min-w-0 flex-1 sm:max-w-[9rem]">
            <label htmlFor={`${idPrefix}-time`} className={uiFilterLabel}>
              Ora
            </label>
            <input
              id={`${idPrefix}-time`}
              type="time"
              disabled={disabled}
              value={dueTime}
              onChange={(e) => onDueTimeChange(e.target.value)}
              className={cn(control, "mt-1")}
            />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onDueDateChange(todayDateInputValue());
              onDueTimeChange("");
            }}
            className={cn(uiBtnSecondary, "mb-0.5 shrink-0 px-2.5 py-2 text-xs")}
          >
            Oggi
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-line-default/70 pt-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={repeatEnabled}
            disabled={disabled}
            onChange={(e) => handleRepeatToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
          />
          <span>
            <span className="block text-sm font-medium text-fg-primary">Ripeti task</span>
            <span className={cn(uiCaption, "mt-0.5 block")}>
              Al completamento si crea automaticamente la prossima scadenza.
            </span>
          </span>
        </label>
      </div>

      <input
        type="hidden"
        name="recurrenceEnabled"
        value={repeatEnabled && hasDueDate ? "1" : "0"}
      />
      <input type="hidden" name="recurrenceJson" value={serializedRule} readOnly />

      {repeatEnabled && hasDueDate ? (
        <div className="mt-4 space-y-4 border-t border-line-default/70 pt-4">
          <div>
            <span className={uiFormLabel}>Frequenza</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-fg-secondary">Ogni</span>
              <input
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
                className={cn(uiControl, "w-16 py-2 text-center tabular-nums")}
              />
              <select
                value={draft.frequency}
                disabled={disabled}
                onChange={(e) =>
                  setFrequency(e.target.value as TaskRecurrence["frequency"])
                }
                className={cn(uiControl, "min-w-[10rem] py-2")}
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {draft.frequency === "weekly" && anchorWeekday != null ? (
            <div>
              <span className={uiFormLabel}>Giorni della settimana</span>
              <p className={cn(uiCaption, "mt-1")}>
                Il giorno della prima scadenza ({WEEKDAY_SHORT[anchorWeekday]}) resta
                sempre incluso.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = draft.weekdays?.includes(index) ?? false;
                  const locked = index === anchorWeekday;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={disabled || locked}
                      aria-pressed={active}
                      title={WEEKDAY_SHORT[index]}
                      onClick={() => toggleWeekday(index)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold",
                        locked && "cursor-default opacity-90",
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

          {draft.frequency === "monthly" && dueIso ? (
            <div>
              <span className={uiFormLabel}>Ripetizione mensile</span>
              <div className="mt-2 space-y-2">
                <label className="flex items-start gap-2 text-sm text-fg-secondary">
                  <input
                    type="radio"
                    name={`${idPrefix}-monthly-mode`}
                    checked={draft.monthlyBy?.mode !== "nthWeekday"}
                    disabled={disabled}
                    onChange={() =>
                      setDraft((prev) =>
                        syncRecurrenceDraftWithDueAt(
                          {
                            ...prev,
                            monthlyBy: {
                              mode: "dayOfMonth",
                              day: new Date(dueIso).getDate(),
                            },
                          },
                          dueIso,
                        ),
                      )
                    }
                    className="mt-1"
                  />
                  <span>
                    Stesso giorno del mese della prima scadenza
                    <span className="mt-0.5 block font-medium text-fg-primary">
                      Giorno {new Date(dueIso).getDate()}
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-fg-secondary">
                  <input
                    type="radio"
                    name={`${idPrefix}-monthly-mode`}
                    checked={draft.monthlyBy?.mode === "nthWeekday"}
                    disabled={disabled}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        monthlyBy: nthWeekdayFromIso(dueIso),
                      }))
                    }
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    Ennesimo giorno della settimana
                    {draft.monthlyBy?.mode === "nthWeekday" ? (
                      <span className="mt-1.5 flex flex-wrap gap-2">
                        <select
                          value={draft.monthlyBy.nth}
                          disabled={disabled}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              monthlyBy: {
                                mode: "nthWeekday",
                                nth: Number(e.target.value) as 1 | 2 | 3 | 4 | -1,
                                weekday:
                                  prev.monthlyBy?.mode === "nthWeekday"
                                    ? prev.monthlyBy.weekday
                                    : weekdayFromIso(dueIso),
                              },
                            }))
                          }
                          className={cn(uiControl, "py-1.5")}
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
                              : weekdayFromIso(dueIso)
                          }
                          disabled={disabled}
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
                          className={cn(uiControl, "py-1.5")}
                        >
                          {WEEKDAY_SHORT.map((label, index) => (
                            <option key={label} value={index}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          <div>
            <span className={uiFormLabel}>Termine ripetizione</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { value: "never", label: "Mai" },
                  { value: "until", label: "Fino a data" },
                  { value: "count", label: "Per N volte" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setEndMode(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    endMode === option.value
                      ? "border-accent/40 bg-accent-muted text-accent"
                      : "border-line-default bg-surface text-fg-secondary hover:bg-elevated",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {endMode === "until" ? (
              <input
                type="date"
                value={untilDate}
                min={dueDate || undefined}
                disabled={disabled}
                onChange={(e) => setUntilDate(e.target.value)}
                className={cn(uiDateControl, "mt-2 py-2")}
              />
            ) : null}
            {endMode === "count" ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={occurrenceCount}
                  disabled={disabled}
                  onChange={(e) =>
                    setOccurrenceCount(Math.max(1, Number(e.target.value) || 1))
                  }
                  className={cn(uiControl, "w-20 py-2 text-center tabular-nums")}
                />
                <span className="text-sm text-fg-secondary">occorrenze totali</span>
              </div>
            ) : null}
          </div>

          {preview ? (
            <p className={cn(uiCaption, "rounded-md bg-surface px-3 py-2 text-fg-secondary")}>
              {preview}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Usa TaskScheduleFields */
export const TaskRecurrenceFields = TaskScheduleFields;
