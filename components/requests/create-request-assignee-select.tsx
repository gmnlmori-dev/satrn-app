"use client";

import { useEffect, useState } from "react";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { listAssigneeOptionsForCreate } from "@/lib/actions/list-assignee-options-for-create";
import { canAssignRequests } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import { uiFormLabel } from "@/lib/typography";
import type { AssigneeOption } from "@/types/profile";

function defaultAssigneeId(
  options: AssigneeOption[],
  currentUserId: string | undefined,
): string {
  if (currentUserId && options.some((o) => o.userId === currentUserId)) {
    return currentUserId;
  }
  return options[0]?.userId ?? "";
}

export function CreateRequestAssigneeSelect({
  teamId,
  idPrefix,
  disabled,
  inputClass,
}: {
  teamId: string;
  idPrefix: string;
  disabled?: boolean;
  inputClass: string;
}) {
  const me = useOptionalCurrentProfile();
  const [options, setOptions] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState(() =>
    me?.userId ?? "",
  );

  const canAssign = me ? canAssignRequests(me.role) : false;

  useEffect(() => {
    if (!canAssign || !teamId) {
      setOptions([]);
      setAssignedUserId(me?.userId ?? "");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    listAssigneeOptionsForCreate(teamId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setOptions([]);
        setAssignedUserId(me?.userId ?? "");
        setLoadError(result.message);
        return;
      }
      setOptions(result.options);
      setAssignedUserId((current) =>
        current && result.options.some((o) => o.userId === current)
          ? current
          : defaultAssigneeId(result.options, me?.userId),
      );
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [canAssign, teamId, me?.userId]);

  if (!canAssign) return null;

  return (
    <div>
      <label htmlFor={`${idPrefix}-assignee`} className={uiFormLabel}>
        Assegnato a
      </label>
      <select
        id={`${idPrefix}-assignee`}
        name="assignedUserId"
        disabled={disabled || loading || !teamId}
        value={assignedUserId}
        onChange={(e) => setAssignedUserId(e.target.value)}
        className={cn(inputClass, loading && "opacity-70")}
      >
        {options.map((o) => (
          <option key={o.userId} value={o.userId}>
            {o.label}
          </option>
        ))}
      </select>
      {loadError ? (
        <p className="mt-1.5 text-xs text-danger">{loadError}</p>
      ) : null}
    </div>
  );
}
