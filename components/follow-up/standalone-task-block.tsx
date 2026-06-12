"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import {
  IconCalendarDays,
  PostponeDueAtPopover,
} from "@/components/follow-up/postpone-due-at-popover";
import { toggleTaskDone } from "@/lib/actions/toggle-task-done";
import { updateTaskDueAt } from "@/lib/actions/update-task";
import { formatDateTime } from "@/lib/date";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import { taskAssigneesLabel } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import {
  dataTableRowClass,
  dataTableThClass,
} from "@/lib/table-ui";
import { uiBtnIcon } from "@/lib/ui-classes";
import type { Task } from "@/types/task";

function PostponeTaskButton({
  task,
  active,
  disabled,
  onToggle,
}: {
  task: Task;
  active: boolean;
  disabled: boolean;
  onToggle: (task: Task, rect: DOMRectReadOnly) => void;
}) {
  return (
    <button
      type="button"
      data-postpone-trigger={task.id}
      title="Sposta scadenza"
      aria-label="Sposta scadenza"
      disabled={disabled}
      aria-expanded={active}
      className={cn(
        uiBtnIcon,
        active && "border-accent/40 bg-accent-subtle text-accent",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task, e.currentTarget.getBoundingClientRect());
      }}
    >
      <IconCalendarDays className="h-4 w-4" />
    </button>
  );
}

export function StandaloneTaskBlock({
  tasks,
  onTasksChange,
  compact = false,
}: {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const { pulseTopBar } = useDetailSaveFeedback();
  const [pending, startTransition] = useTransition();
  const [postpone, setPostpone] = useState<{
    task: Task;
    rect: DOMRectReadOnly;
  } | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    if (!postpone) return;
    const taskId = postpone.task.id;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-postpone-panel]")) return;
      if (t.closest(`[data-postpone-trigger="${taskId}"]`)) return;
      setPostpone(null);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [postpone]);

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

  function togglePostpone(task: Task, rect: DOMRectReadOnly) {
    setPostpone((p) => (p?.task.id === task.id ? null : { task, rect }));
  }

  if (compact) {
    return (
      <>
        {postpone ? (
          <PostponeDueAtPopover
            key={postpone.task.id}
            idPrefix={`postpone-task-${postpone.task.id}`}
            title={postpone.task.title}
            currentDueAt={postpone.task.dueAt}
            anchorRect={postpone.rect}
            onDismiss={() => setPostpone(null)}
            onApply={async (iso) => {
              const r = await updateTaskDueAt(postpone.task.id, iso);
              if (r.ok) {
                pulseTopBar();
                refresh();
              }
              return r;
            }}
          />
        ) : null}
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
                <PostponeTaskButton
                  task={task}
                  active={postpone?.task.id === task.id}
                  disabled={pending}
                  onToggle={togglePostpone}
                />
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <>
      {postpone ? (
        <PostponeDueAtPopover
          key={postpone.task.id}
          idPrefix={`postpone-task-${postpone.task.id}`}
          title={postpone.task.title}
          currentDueAt={postpone.task.dueAt}
          anchorRect={postpone.rect}
          onDismiss={() => setPostpone(null)}
          onApply={async (iso) => {
            const r = await updateTaskDueAt(postpone.task.id, iso);
            if (r.ok) {
              pulseTopBar();
              refresh();
            }
            return r;
          }}
        />
      ) : null}
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
              <th className={cn(dataTableThClass, "w-12 text-right")}>
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
                  <td className="px-3 py-2.5 text-right">
                    <PostponeTaskButton
                      task={task}
                      active={postpone?.task.id === task.id}
                      disabled={pending}
                      onToggle={togglePostpone}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
