"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { PostponeDueAtPopover } from "@/components/follow-up/postpone-due-at-popover";
import { PostponeTaskButton } from "@/components/tasks/postpone-task-button";
import { TaskRecurrenceSummary } from "@/components/tasks/task-recurrence-summary";
import { TaskEditSlideOver } from "@/components/tasks/task-edit-slide-over";
import { toggleTaskDone } from "@/lib/actions/toggle-task-done";
import { updateTaskDueAt } from "@/lib/actions/update-task";
import { formatDateTime } from "@/lib/date";
import { applyTaskToggleResult } from "@/lib/task-recurrence";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import { taskAssigneesLabel } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import {
  dataTableRowClass,
  dataTableThClass,
} from "@/lib/table-ui";
import { uiBtnIcon } from "@/lib/ui-classes";
import type { Task } from "@/types/task";

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function EditTaskButton({
  task,
  disabled,
  onEdit,
}: {
  task: Task;
  disabled: boolean;
  onEdit: (task: Task) => void;
}) {
  return (
    <button
      type="button"
      className={uiBtnIcon}
      title="Modifica task"
      aria-label={`Modifica: ${task.title}`}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}
    >
      <IconPencil className="h-4 w-4" />
    </button>
  );
}

function TaskRowActions({
  task,
  postponeActive,
  disabled,
  onEdit,
  onTogglePostpone,
}: {
  task: Task;
  postponeActive: boolean;
  disabled: boolean;
  onEdit: (task: Task) => void;
  onTogglePostpone: (task: Task, rect: DOMRectReadOnly) => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <EditTaskButton task={task} disabled={disabled} onEdit={onEdit} />
      <PostponeTaskButton
        task={task}
        active={postponeActive}
        disabled={disabled}
        onToggle={onTogglePostpone}
      />
    </div>
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
      if (!result.ok) return;
      if (onTasksChange) {
        onTasksChange(
          tasks.map((t) =>
            t.id === task.id ? applyTaskToggleResult(t, result) : t,
          ),
        );
      } else {
        pulseTopBar();
        refresh();
      }
    });
  }

  function togglePostpone(task: Task, rect: DOMRectReadOnly) {
    setPostpone((p) => (p?.task.id === task.id ? null : { task, rect }));
  }

  function openEdit(task: Task) {
    setPostpone(null);
    setEditingTask(task);
  }

  function handleTaskUpdated() {
    pulseTopBar();
    refresh();
  }

  const slideOver = (
    <TaskEditSlideOver
      task={editingTask}
      onClose={() => setEditingTask(null)}
      onUpdated={() => handleTaskUpdated()}
      onDeleted={() => handleTaskUpdated()}
    />
  );

  if (compact) {
    return (
      <>
        {slideOver}
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
                  <TaskRecurrenceSummary
                    recurrence={task.recurrence}
                    className="mt-1 block"
                  />
                </div>
                <TaskRowActions
                  task={task}
                  postponeActive={postpone?.task.id === task.id}
                  disabled={pending}
                  onEdit={openEdit}
                  onTogglePostpone={togglePostpone}
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
      {slideOver}
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
              <th className={cn(dataTableThClass, "w-20 text-right")}>
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
                    <TaskRowActions
                      task={task}
                      postponeActive={postpone?.task.id === task.id}
                      disabled={pending}
                      onEdit={openEdit}
                      onTogglePostpone={togglePostpone}
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
