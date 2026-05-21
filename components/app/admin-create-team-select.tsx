"use client";

import {
  useOptionalCurrentProfile,
  useTeamsForCreate,
} from "@/components/app/current-user-context";
import { cn } from "@/lib/cn";
import { uiFormLabel } from "@/lib/typography";

export function AdminCreateTeamSelect({
  idPrefix,
  disabled,
  inputClass,
  teamId,
  onTeamChange,
}: {
  idPrefix: string;
  disabled?: boolean;
  inputClass: string;
  teamId?: string;
  onTeamChange?: (teamId: string) => void;
}) {
  const me = useOptionalCurrentProfile();
  const teams = useTeamsForCreate();

  if (me?.role !== "admin" || teams.length === 0) return null;

  const selectedTeamId = teamId ?? me.teamId;

  return (
    <div>
      <label htmlFor={`${idPrefix}-team`} className={uiFormLabel}>
        Team <span className="text-danger">*</span>
      </label>
      <select
        id={`${idPrefix}-team`}
        name="teamId"
        required
        disabled={disabled}
        value={onTeamChange ? selectedTeamId : undefined}
        defaultValue={onTeamChange ? undefined : me.teamId}
        onChange={
          onTeamChange
            ? (e) => onTeamChange(e.target.value)
            : undefined
        }
        className={cn(inputClass)}
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
