"use client";

import { useState } from "react";
import {
  fromDateAndTimeInputs,
  isEndOfLocalDayIso,
  todayDateInputValue,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiBtnSecondary, uiDateControl } from "@/lib/ui-classes";
import { uiFilterLabel, uiFormLabel } from "@/lib/typography";

type Props = {
  idPrefix: string;
  disabled?: boolean;
  defaultIso?: string | null;
  inputClass?: string;
  /** Modalità controllata (dettaglio / follow-up). */
  date?: string;
  time?: string;
  onDateChange?: (value: string) => void;
  onTimeChange?: (value: string) => void;
  hideHeading?: boolean;
  hideHint?: boolean;
  showToday?: boolean;
};

export function NextActionDeadlineFields({
  idPrefix,
  disabled,
  defaultIso = null,
  inputClass,
  date: controlledDate,
  time: controlledTime,
  onDateChange,
  onTimeChange,
  hideHeading = false,
  hideHint = false,
  showToday = true,
}: Props) {
  const control = cn(uiDateControl, "py-2.5 text-[15px]", inputClass);
  const [internalDate, setInternalDate] = useState(() =>
    toDateInputValue(defaultIso),
  );
  const [internalTime, setInternalTime] = useState(() =>
    toTimeInputValue(defaultIso),
  );

  const controlled = controlledDate !== undefined;
  const date = controlled ? controlledDate : internalDate;
  const time = controlled ? (controlledTime ?? "") : internalTime;

  const setDate = (value: string) => {
    if (controlled) onDateChange?.(value);
    else setInternalDate(value);
  };

  const setTime = (value: string) => {
    if (controlled) onTimeChange?.(value);
    else setInternalTime(value);
  };

  const computedIso =
    !controlled && date ? fromDateAndTimeInputs(date, time) : null;

  return (
    <div>
      {!hideHeading ? (
        <span className={uiFormLabel}>
          Scadenza prossima azione{" "}
          <span className="text-sm font-normal text-fg-tertiary">(opzionale)</span>
        </span>
      ) : null}
      <div
        className={cn(
          "flex flex-wrap items-end gap-2",
          !hideHeading && "mt-1.5",
        )}
      >
        <div className="min-w-0 flex-1 sm:max-w-[12rem]">
          <label htmlFor={`${idPrefix}-date`} className={uiFilterLabel}>
            Data
          </label>
          <input
            id={`${idPrefix}-date`}
            name={controlled ? undefined : "nextActionAtDate"}
            type="date"
            disabled={disabled}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(control, "mt-1")}
          />
        </div>
        <div className="min-w-0 flex-1 sm:max-w-[9rem]">
          <label htmlFor={`${idPrefix}-time`} className={uiFilterLabel}>
            Ora
          </label>
          <input
            id={`${idPrefix}-time`}
            name={controlled ? undefined : "nextActionAtTime"}
            type="time"
            disabled={disabled}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={cn(control, "mt-1")}
          />
        </div>
        {showToday ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setDate(todayDateInputValue());
              setTime("");
            }}
            className={cn(uiBtnSecondary, "mb-0.5 shrink-0 px-2.5 py-2 text-xs")}
          >
            Oggi
          </button>
        ) : null}
      </div>
      {!controlled && computedIso ? (
        <input type="hidden" name="nextActionAtIso" value={computedIso} readOnly />
      ) : null}
      {!hideHint ? (
        <p className="mt-1.5 text-xs text-fg-tertiary">
          Solo data: scadenza a fine giornata. L&apos;ora è facoltativa.
        </p>
      ) : null}
    </div>
  );
}

/** Valori iniziali data/ora da ISO (o stringa datetime-local legacy). */
export function nextActionDeadlineDraftFromIso(
  iso: string | null | undefined,
): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  return {
    date: toDateInputValue(iso),
    time: isEndOfLocalDayIso(iso) ? "" : toTimeInputValue(iso),
  };
}

export function nextActionDeadlineDraftEquals(
  iso: string | null,
  date: string,
  time: string,
): boolean {
  return (
    toDateInputValue(iso) === date && toTimeInputValue(iso) === time
  );
}
