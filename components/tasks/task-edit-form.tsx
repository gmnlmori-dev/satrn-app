"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import {
  NextActionDeadlineFields,
  nextActionDeadlineDraftFromIso,
} from "@/components/requests/next-action-deadline-fields";
import { RequestAssigneeFormFields } from "@/components/requests/request-assignees-field";
import { deleteTask } from "@/lib/actions/delete-task";
import { listAssigneeOptionsForCreate } from "@/lib/actions/list-assignee-options-for-create";
import { updateTask } from "@/lib/actions/update-task";
import { updateTaskAssignment } from "@/lib/actions/update-task-assignment";
import { fromDateAndTimeInputs } from "@/lib/date";
import { canAssignRequests } from "@/lib/permissions";
import { taskAssignedUserIds } from "@/lib/task-assignees";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiControl } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { Task } from "@/types/task";
import type { AssigneeOption } from "@/types/profile";

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
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [assigneeLoadError, setAssigneeLoadError] = useState<string | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState(() =>
    taskAssignedUserIds(task),
  );
  const initialDue = nextActionDeadlineDraftFromIso(task.dueAt);
  const [dueDate, setDueDate] = useState(initialDue.date);
  const [dueTime, setDueTime] = useState(initialDue.time);

  const canAssign = me ? canAssignRequests(me.role) : false;

  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    setAssigneeLoading(true);
    setAssigneeLoadError(null);
    listAssigneeOptionsForCreate(task.teamId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setAssigneeOptions([]);
        setAssigneeLoadError(result.message);
      } else {
        setAssigneeOptions(result.options);
      }
      setAssigneeLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [canAssign, task.teamId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("nextActionAtDate", dueDate);
    fd.set("nextActionAtTime", dueTime);

    startTransition(async () => {
      const updateResult = await updateTask(task.id, fd);
      if (!updateResult.ok) {
        setError(updateResult.message);
        return;
      }

      const nextDueAt = fromDateAndTimeInputs(dueDate, dueTime);
      let nextTask: Task = {
        ...task,
        title: String(fd.get("title") ?? "").trim(),
        dueAt: nextDueAt,
      };

      if (canAssign) {
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

      <NextActionDeadlineFields
        idPrefix={idPrefix}
        disabled={pending}
        hideHeading={false}
        hideHint
        date={dueDate}
        time={dueTime}
        onDateChange={setDueDate}
        onTimeChange={setDueTime}
      />

      {canAssign ? (
        <div>
          <p className={uiFormLabel}>Assegnatari</p>
          <RequestAssigneeFormFields
            idPrefix={idPrefix}
            options={assigneeOptions}
            selectedIds={assignedUserIds}
            disabled={pending}
            loading={assigneeLoading}
            loadError={assigneeLoadError}
            onChange={setAssignedUserIds}
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
