"use client";

import { AppSlideOver } from "@/components/app/app-slide-over";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import type { Task } from "@/types/task";

export function TaskEditSlideOver({
  task,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: Task | null;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}) {
  const open = task !== null;

  return (
    <AppSlideOver
      open={open}
      onClose={onClose}
      title="Modifica task"
      description={task ? task.title : undefined}
      slideFrom="left"
      portal
    >
      {task ? (
        <TaskEditForm
          task={task}
          onSuccess={onUpdated}
          onDeleted={onDeleted}
          onCancel={onClose}
        />
      ) : null}
    </AppSlideOver>
  );
}
