"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  fromDateAndTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/date";
import { uiBtnGhost, uiControl, uiDateControl, uiTransition } from "@/lib/ui-classes";
import {
  createNextActionTask,
  parseNextAction,
  serializeNextAction,
  type NextActionContent,
  type NextActionTask,
} from "@/lib/next-action-tasks";
import {
  checklistDueAfterNextActionMessage,
  isChecklistDueAllowed,
} from "@/lib/next-action-deadline-validation";

type Props = {
  value: string;
  onChange: (serialized: string) => void;
  disabled?: boolean;
  name?: string;
  idPrefix?: string;
  textRows?: number;
  className?: string;
  /** Scadenza richiesta già impostata (limita le date checklist). */
  requestNextActionAt?: string | null;
  onValidationError?: (message: string | null) => void;
};

function updateTask(
  tasks: NextActionTask[],
  id: string,
  patch: Partial<Pick<NextActionTask, "text" | "done" | "dueAt">>,
): NextActionTask[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
}

function TaskDueFields({
  idPrefix,
  taskId,
  dueAt,
  disabled,
  requestNextActionAt,
  onValidationError,
  onChange,
}: {
  idPrefix: string;
  taskId: string;
  dueAt: string | null;
  disabled?: boolean;
  requestNextActionAt?: string | null;
  onValidationError?: (message: string | null) => void;
  onChange: (dueAt: string | null) => void;
}) {
  const date = toDateInputValue(dueAt);
  const time = toTimeInputValue(dueAt);

  function applyDue(next: string | null) {
    if (next && !isChecklistDueAllowed(next, requestNextActionAt ?? null)) {
      onValidationError?.(checklistDueAfterNextActionMessage());
      return;
    }
    onValidationError?.(null);
    onChange(next);
  }

  function setDate(nextDate: string) {
    if (!nextDate.trim()) {
      applyDue(null);
      return;
    }
    applyDue(fromDateAndTimeInputs(nextDate, time));
  }

  function setTime(nextTime: string) {
    if (!date) return;
    applyDue(fromDateAndTimeInputs(date, nextTime));
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1 sm:max-w-[9.5rem]">
        <label htmlFor={`${idPrefix}-task-${taskId}-date`} className="sr-only">
          Scadenza task
        </label>
        <input
          id={`${idPrefix}-task-${taskId}-date`}
          type="date"
          disabled={disabled}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={cn(uiDateControl, "py-2 text-sm")}
        />
      </div>
      <div className="min-w-0 flex-1 sm:max-w-[7rem]">
        <label htmlFor={`${idPrefix}-task-${taskId}-time`} className="sr-only">
          Ora task
        </label>
        <input
          id={`${idPrefix}-task-${taskId}-time`}
          type="time"
          disabled={disabled || !date}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={cn(uiDateControl, "py-2 text-sm")}
        />
      </div>
    </div>
  );
}

export function NextActionField({
  value,
  onChange,
  disabled,
  name = "nextAction",
  idPrefix = "next-action",
  textRows = 4,
  className,
  requestNextActionAt = null,
  onValidationError,
}: Props) {
  const [content, setContent] = useState<NextActionContent>(() =>
    parseNextAction(value),
  );
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setContent(parseNextAction(value));
    }
  }, [value]);

  const serialized = useMemo(() => serializeNextAction(content), [content]);

  useEffect(() => {
    if (serialized === lastEmittedRef.current) return;
    lastEmittedRef.current = serialized;
    onChange(serialized);
  }, [serialized, onChange]);

  function patchContent(next: NextActionContent) {
    setContent(next);
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input type="hidden" name={name} value={serialized} readOnly />

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-text`}
          className="text-xs font-medium uppercase tracking-wide text-fg-tertiary"
        >
          Note
        </label>
        <textarea
          id={`${idPrefix}-text`}
          rows={textRows}
          disabled={disabled}
          value={content.text}
          onChange={(e) =>
            patchContent({
              ...content,
              text: e.target.value,
            })
          }
          className={cn(uiControl, "min-h-[5rem] resize-y text-[15px]")}
          placeholder="Prossimo passo operativo, contesto o note…"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-tertiary">
          Checklist
        </p>
        {content.tasks.length > 0 ? (
          <ul className="space-y-2">
            {content.tasks.map((task, index) => (
              <li
                key={task.id}
                className="space-y-2 rounded-[10px] border border-line-default p-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={disabled}
                    onChange={(e) =>
                      patchContent({
                        ...content,
                        tasks: updateTask(content.tasks, task.id, {
                          done: e.target.checked,
                        }),
                      })
                    }
                    aria-label={`Segna task ${index + 1} come completato`}
                    className="mt-2.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
                  />
                  <input
                    type="text"
                    disabled={disabled}
                    value={task.text}
                    onChange={(e) =>
                      patchContent({
                        ...content,
                        tasks: updateTask(content.tasks, task.id, {
                          text: e.target.value,
                        }),
                      })
                    }
                    placeholder={`Task ${index + 1}`}
                    className={cn(
                      uiControl,
                      "min-w-0 flex-1 py-2 text-[15px]",
                      task.done && "text-fg-tertiary line-through",
                    )}
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      patchContent({
                        ...content,
                        tasks: content.tasks.filter((t) => t.id !== task.id),
                      })
                    }
                    className={cn(
                      uiBtnGhost,
                      uiTransition,
                      "mt-0.5 h-9 w-9 shrink-0 px-0 text-fg-tertiary hover:text-danger",
                    )}
                    aria-label={`Rimuovi task ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
                <div className="pl-6">
                  <TaskDueFields
                    idPrefix={idPrefix}
                    taskId={task.id}
                    dueAt={task.dueAt}
                    disabled={disabled}
                    requestNextActionAt={requestNextActionAt}
                    onValidationError={onValidationError}
                    onChange={(dueAt) =>
                      patchContent({
                        ...content,
                        tasks: updateTask(content.tasks, task.id, { dueAt }),
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            patchContent({
              ...content,
              tasks: [...content.tasks, createNextActionTask()],
            })
          }
          className={cn(uiBtnGhost, "text-sm")}
        >
          Aggiungi task
        </button>
      </div>
    </div>
  );
}
