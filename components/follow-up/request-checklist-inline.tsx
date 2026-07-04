"use client";

import { useState, useTransition } from "react";
import { toggleNextActionTask } from "@/lib/actions/toggle-next-action-task";
import { formatDateTime } from "@/lib/date";
import {
  isCalendarTaskOverdue,
  parseNextAction,
  sortChecklistTasksForFollowUp,
  type NextActionTask,
} from "@/lib/next-action-tasks";
import {
  followUpHiddenChecklistDueAts,
  isChecklistDueHiddenInFollowUp,
} from "@/lib/follow-up-request-deadline";
import { cn } from "@/lib/cn";
import { ExpandableChecklistTaskText } from "@/components/requests/checklist-task-text";
import { uiTransition } from "@/lib/ui-classes";

export function RequestChecklistInline({
  requestId,
  nextAction,
  nextActionAt = null,
  disabled = false,
  onChanged,
}: {
  requestId: string;
  nextAction: string;
  nextActionAt?: string | null;
  disabled?: boolean;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const content = parseNextAction(nextAction);
  const openTasks = sortChecklistTasksForFollowUp(
    content.tasks.filter((task) => task.text.trim() && !task.done),
    content.tasks,
  );

  const hiddenDueAts = followUpHiddenChecklistDueAts({
    nextActionAt,
    nextAction,
  });

  if (openTasks.length === 0) return null;

  const overdueCount = openTasks.filter((task) =>
    isCalendarTaskOverdue(task),
  ).length;

  function completeTask(task: NextActionTask) {
    setPendingTaskId(task.id);
    startTransition(async () => {
      const res = await toggleNextActionTask(requestId, task.id, true);
      setPendingTaskId(null);
      if (res.ok) onChanged?.();
    });
  }

  const toggleLabel =
    openTasks.length === 1
      ? "1 task checklist aperta"
      : `${openTasks.length} task checklist aperti`;

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={
          open
            ? `Nascondi checklist interna (${toggleLabel})`
            : `Mostra checklist interna (${toggleLabel})`
        }
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          uiTransition,
          "flex max-w-full items-center gap-1.5 rounded-[6px] py-0.5 text-left text-xs text-fg-secondary",
          "hover:text-fg-primary disabled:opacity-60",
        )}
      >
        <svg
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-fg-tertiary transition-transform",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
        <span className="min-w-0 truncate">
          <span className="font-medium text-fg-tertiary">Checklist</span>
          <span className="text-fg-tertiary"> · </span>
          <span>{toggleLabel}</span>
          {overdueCount > 0 ? (
            <span className="font-medium text-danger">
              {` · ${overdueCount} in ritardo`}
            </span>
          ) : null}
        </span>
      </button>

      {open ? (
        <div className="mt-1.5 rounded-[8px] border border-line-default/80 bg-canvas/50 px-2.5 py-2">
          <ul className="space-y-1">
            {openTasks.map((task) => {
              const overdue = isCalendarTaskOverdue(task);
              const busy = pending && pendingTaskId === task.id;
              return (
                <li key={task.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={disabled || busy}
                    onChange={() => completeTask(task)}
                    aria-label={`Segna completato: ${task.text}`}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line-default accent-accent"
                  />
                  <div className="min-w-0 flex-1">
                    <ExpandableChecklistTaskText text={task.text} />
                    {task.dueAt &&
                    !isChecklistDueHiddenInFollowUp(task.dueAt, hiddenDueAts) ? (
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] tabular-nums",
                          overdue ? "font-medium text-danger" : "text-fg-tertiary",
                        )}
                      >
                        {formatDateTime(task.dueAt)}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
