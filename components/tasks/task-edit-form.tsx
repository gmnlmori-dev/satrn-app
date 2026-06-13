"use client";

import { useId, useState, useTransition } from "react";
import { AdminCreateTeamSelect } from "@/components/app/admin-create-team-select";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { CreateRequestAssigneeSelect } from "@/components/requests/create-request-assignee-select";
import { nextActionDeadlineDraftFromIso } from "@/components/requests/next-action-deadline-fields";
import { TaskScheduleFields } from "@/components/tasks/task-recurrence-fields";
import { deleteTask } from "@/lib/actions/delete-task";
import { updateTask } from "@/lib/actions/update-task";
import { updateTaskAssignment } from "@/lib/actions/update-task-assignment";
import { fromDateAndTimeInputs } from "@/lib/date";
import { recurrenceFromFormData } from "@/lib/task-recurrence";
import { canAssignRequests } from "@/lib/permissions";
import { taskAssignedUserIds } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiControl } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { Task } from "@/types/task";

function parseAssigneeIds(fd: FormData): string[] {
  return [
    ...new Set(
      fd
        .getAll("assignedUserIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
}

export function TaskEditForm({
  task,
  onSuccess,
  onCancel,
  onDeleted,
}: {
  task: Task;
  onSuccess: (updated: Task) => void;
  onCancel: () => void;
  onDeleted: (taskId: string) => void;
}) {
  const me = useOptionalCurrentProfile();
  const idPrefix = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [assigneeTeamId, setAssigneeTeamId] = useState(task.teamId);
  const initialDue = nextActionDeadlineDraftFromIso(task.dueAt);
  const [dueDate, setDueDate] = useState(initialDue.date);
  const [dueTime, setDueTime] = useState(initialDue.time);

  const canAssign = me ? canAssignRequests(me.role) : false;
  const assigneeTeamIdForSelect =
    me?.role === "admin" ? assigneeTeamId : task.teamId;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("nextActionAtDate", dueDate);
    fd.set("nextActionAtTime", dueTime);
    const dueIso = fromDateAndTimeInputs(dueDate, dueTime);
    if (dueIso) fd.set("nextActionAtIso", dueIso);
    else fd.delete("nextActionAtIso");

    startTransition(async () => {
      const updateResult = await updateTask(task.id, fd);
      if (!updateResult.ok) {
        setError(updateResult.message);
        return;
      }

      const nextDueAt = fromDateAndTimeInputs(dueDate, dueTime);
      const recurrence = recurrenceFromFormData(fd, nextDueAt, task.recurrence);
      let nextTask: Task = {
        ...task,
        title: String(fd.get("title") ?? "").trim(),
        dueAt: nextDueAt,
        recurrence,
      };

      if (canAssign) {
        const assignedUserIds = parseAssigneeIds(fd);
        const assignResult = await updateTaskAssignment(task.id, assignedUserIds);
        if (!assignResult.ok) {
          setError(assignResult.message);
          return;
        }
        nextTask = {
          ...nextTask,
          assignees: assignResult.assignees,
          assignedUserId: assignResult.assignedUserId,
          assignedAt: assignResult.assignedAt,
          assignedToLabel: assignResult.assignedToLabel,
        };
      }

      onSuccess(nextTask);
    });
  }

  function handleDelete() {
    if (!window.confirm("Eliminare questa task? L'azione non è reversibile.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDeleted(task.id);
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor={`${idPrefix}-title`} className={uiFormLabel}>
          Titolo
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          required
          defaultValue={task.title}
          disabled={pending}
          className={cn(uiControl, "mt-1 py-2.5")}
        />
      </div>

      <TaskScheduleFields
        idPrefix={idPrefix}
        dueDate={dueDate}
        dueTime={dueTime}
        onDueDateChange={setDueDate}
        onDueTimeChange={setDueTime}
        disabled={pending}
        initialRecurrence={task.recurrence}
      />

      {canAssign && assigneeTeamIdForSelect ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCreateTeamSelect
            idPrefix={idPrefix}
            disabled={pending}
            inputClass={cn(uiControl, "py-2.5 text-[15px]")}
            teamId={assigneeTeamId}
            onTeamChange={setAssigneeTeamId}
          />
          <CreateRequestAssigneeSelect
            key={`${task.id}-${assigneeTeamIdForSelect}`}
            teamId={assigneeTeamIdForSelect}
            idPrefix={idPrefix}
            disabled={pending}
            initialSelectedIds={taskAssignedUserIds(task)}
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className={uiBtnPrimary} disabled={pending} aria-busy={pending}>
            {pending ? "Salvataggio…" : "Salva"}
          </button>
          <button
            type="button"
            className="text-sm text-fg-secondary hover:text-fg-primary"
            onClick={onCancel}
            disabled={pending}
          >
            Annulla
          </button>
        </div>
        <button
          type="button"
          className={cn(uiBtnSecondary, "text-danger hover:text-danger")}
          onClick={handleDelete}
          disabled={pending}
        >
          Elimina
        </button>
      </div>
    </form>
  );
}
