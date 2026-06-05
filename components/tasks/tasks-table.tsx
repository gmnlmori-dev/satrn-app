"use client";

import { useTransition } from "react";
import { toggleTaskDone } from "@/lib/actions/toggle-task-done";
import { formatDateTime } from "@/lib/date";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import { taskAssigneesLabel } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";
import {
  dataTableRowClass,
  dataTableThClass,
} from "@/lib/table-ui";
import type { Task } from "@/types/task";

type Props = {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
};

export function TasksTable({ tasks, onTasksChange }: Props) {
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
