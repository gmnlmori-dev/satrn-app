"use client";

import { useTransition } from "react";
import { toggleTaskDone } from "@/lib/actions/toggle-task-done";
import { formatDateTime } from "@/lib/date";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import { taskAssigneesLabel } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import { uiBtnIcon, uiTransition } from "@/lib/ui-classes";
import {
  dataTableRowClass,
  dataTableThClass,
} from "@/lib/table-ui";
import type { Task } from "@/types/task";

type Props = {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  onEditTask?: (task: Task) => void;
};

export function TasksTable({ tasks, onTasksChange, onEditTask }: Props) {
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

  return (
    <div className="overflow-x-auto rounded-lg border border-line-default">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line-default bg-elevated/50">
            <th className={cn(dataTableThClass, "w-10")}>
              <span className="sr-only">Completata</span>
            </th>
            <th className={dataTableThClass}>Titolo</th>
            <th className={dataTableThClass}>Scadenza</th>
            <th className={dataTableThClass}>Assegnatari</th>
            <th className={cn(dataTableThClass, "w-12")}>
              <span className="sr-only">Azioni</span>
            </th>
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
                    aria-label={`Segna come ${task.done ? "non completata" : "completata"}: ${task.title}`}
                    className="h-4 w-4 rounded border-line-default text-accent focus:ring-accent/40"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "font-medium",
                      task.done
                        ? "text-fg-tertiary line-through"
                        : "text-fg-primary",
                    )}
                  >
                    {task.title}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {task.dueAt ? (
                    <span
                      className={cn(
                        uiTransition,
                        overdue && !task.done
                          ? "font-medium text-danger"
                          : "text-fg-secondary",
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
                    <span className="text-fg-tertiary">Non assegnata</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    className={uiBtnIcon}
                    aria-label={`Modifica: ${task.title}`}
                    disabled={pending}
                    onClick={() => onEditTask?.(task)}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
