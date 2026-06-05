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
}: {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
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
