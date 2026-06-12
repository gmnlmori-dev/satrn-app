"use client";

import { useState, useTransition } from "react";
import { toggleNextActionTask } from "@/lib/actions/toggle-next-action-task";
import { formatDateTime } from "@/lib/date";
import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import {
  isCalendarTaskOverdue,
  parseNextAction,
  type NextActionTask,
} from "@/lib/next-action-tasks";
import { cn } from "@/lib/cn";

function sortOpenChecklistTasks(tasks: NextActionTask[]): NextActionTask[] {
  const startToday = new Date(getFollowUpWindowBounds().startTodayIso).getTime();

  return [...tasks].sort((a, b) => {
    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : null;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : null;
    const aOverdue = aDue !== null && aDue < startToday;
    const bOverdue = bDue !== null && bDue < startToday;

    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
    if (aDue !== null && bDue === null) return -1;
    if (aDue === null && bDue !== null) return 1;
    return a.text.localeCompare(b.text, "it");
  });
}

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
  const openTasks = sortOpenChecklistTasks(
    parseNextAction(nextAction).tasks.filter((task) => task.text.trim() && !task.done),
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
