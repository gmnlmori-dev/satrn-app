"use client";

import { useId, useState, useTransition } from "react";
import { AdminCreateTeamSelect } from "@/components/app/admin-create-team-select";
import { CreateRequestAssigneeSelect } from "@/components/requests/create-request-assignee-select";
import { NextActionDeadlineFields } from "@/components/requests/next-action-deadline-fields";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { createTask } from "@/lib/actions/create-task";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiControl } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";

export function NewTaskForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const me = useOptionalCurrentProfile();
  const idPrefix = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createTeamId, setCreateTeamId] = useState(me?.teamId ?? "");
  const assigneeTeamId =
    me?.role === "admin" ? createTeamId : (me?.teamId ?? "");

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await createTask(fd);
          if (!result.ok) {
            setError(result.message);
            return;
          }
          onSuccess();
        });
      }}
    >
      <div>
        <label htmlFor={`${idPrefix}-title`} className={uiFormLabel}>
          Titolo
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          required
          disabled={pending}
          className={cn(uiControl, "mt-1 py-2.5")}
          placeholder="Es. Preparare report settimanale"
        />
      </div>

      <NextActionDeadlineFields
        idPrefix={idPrefix}
        disabled={pending}
        hideHeading={false}
        hideHint
      />

      {assigneeTeamId ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCreateTeamSelect
            idPrefix={idPrefix}
            disabled={pending}
            inputClass={cn(uiControl, "py-2.5 text-[15px]")}
            teamId={createTeamId}
            onTeamChange={setCreateTeamId}
          />
          <CreateRequestAssigneeSelect
            teamId={assigneeTeamId}
            idPrefix={idPrefix}
            disabled={pending}
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" className={uiBtnPrimary} disabled={pending} aria-busy={pending}>
          {pending ? "Salvataggio…" : "Crea task"}
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
    </form>
  );
}
