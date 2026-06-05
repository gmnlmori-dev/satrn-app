"use client";

import { useTransition } from "react";
import { toggleTaskDone } from "@/lib/actions/toggle-task-done";
import { formatDateTime } from "@/lib/date";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import { taskAssigneesLabel } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import {
  dataTableRowClass,
  dataTableThClass,
} from "@/lib/table-ui";
import type { Task } from "@/types/task";

export function StandaloneTaskBlock({
  tasks,
  onTasksChange,
  compact = false,
}: {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle(task: Task) {
    const nextDone = !task.done;
    startTransition(async () => {
      const result = await toggleTaskDone(task.id, nextDone);
      if (!result.ok || !onTasksChange) return;
      onTasksChange(
        tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                done: nextDone,
                completedAt: nextDone ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
    });
  }

  if (compact) {
    return (
      <ul className="divide-y divide-line-default">
        {tasks.map((task) => {
          const overdue = isStandaloneTaskOverdue(task);
          return (
            <li
              key={task.id}
              className="flex items-start gap-3 px-4 py-3 sm:px-5"
            >
              <input
                type="checkbox"
                checked={task.done}
                disabled={pending}
                onChange={() => handleToggle(task)}
                aria-label={`Segna completata: ${task.title}`}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-fg-primary">
                  {task.title}
                </p>
                <p className="mt-1 text-xs text-fg-tertiary">
                  {task.dueAt ? (
                    <span
                      className={cn(
                        "tabular-nums",
                        overdue && "font-medium text-danger",
                      )}
                    >
                      {formatDateTime(task.dueAt)}
                    </span>
                  ) : (
                    <span>Senza scadenza</span>
                  )}
                  {taskAssigneesLabel(task) ? (
                    <span>{` · ${taskAssigneesLabel(task)}`}</span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line-default bg-elevated/40">
            <th className={cn(dataTableThClass, "w-10")}>
              <span className="sr-only">Completata</span>
            </th>
            <th className={dataTableThClass}>Task</th>
            <th className={dataTableThClass}>Scadenza</th>
            <th className={dataTableThClass}>Assegnatari</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isStandaloneTaskOverdue(task);
            return (
              <tr key={task.id} className={dataTableRowClass}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={pending}
                    onChange={() => handleToggle(task)}
                    aria-label={`Segna completata: ${task.title}`}
                    className="h-4 w-4 rounded border-line-default accent-accent"
                  />
                </td>
                <td className="px-3 py-2.5 font-medium text-fg-primary">
                  {task.title}
                </td>
                <td className="px-3 py-2.5">
                  {task.dueAt ? (
                    <span
                      className={cn(
                        "tabular-nums",
                        overdue ? "font-medium text-danger" : "text-fg-secondary",
                      )}
                    >
                      {formatDateTime(task.dueAt)}
                    </span>
                  ) : (
                    <span className="text-fg-tertiary">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-fg-secondary">
                  {taskAssigneesLabel(task) ?? (
                    <span className="text-fg-tertiary">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
