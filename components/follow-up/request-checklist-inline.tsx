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
import { cn } from "@/lib/cn";

export function RequestChecklistInline({
  requestId,
  nextAction,
  disabled = false,
  onChanged,
}: {
  requestId: string;
  nextAction: string;
  disabled?: boolean;
  onChanged?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const content = parseNextAction(nextAction);
  const openTasks = sortChecklistTasksForFollowUp(
    content.tasks.filter((task) => task.text.trim() && !task.done),
    content.tasks,
  );

  if (openTasks.length === 0) return null;

  function completeTask(task: NextActionTask) {
    setPendingTaskId(task.id);
    startTransition(async () => {
      const res = await toggleNextActionTask(requestId, task.id, true);
      setPendingTaskId(null);
      if (res.ok) onChanged?.();
    });
  }

  return (
    <div
      className="mt-2 rounded-[8px] border border-line-default/80 bg-canvas/50 px-2.5 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
        Checklist · {openTasks.length}
      </p>
      <ul className="mt-1.5 space-y-1">
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
                <p className="text-xs leading-snug text-fg-primary">{task.text}</p>
                {task.dueAt ? (
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
  );
}
