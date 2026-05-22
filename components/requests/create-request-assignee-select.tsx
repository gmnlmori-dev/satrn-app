"use client";

import { useEffect, useState } from "react";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { RequestAssigneeFormFields } from "@/components/requests/request-assignees-field";
import { listAssigneeOptionsForCreate } from "@/lib/actions/list-assignee-options-for-create";
import { canAssignRequests } from "@/lib/permissions";
import type { AssigneeOption } from "@/types/profile";

function defaultAssigneeIds(
  options: AssigneeOption[],
  currentUserId: string | undefined,
): string[] {
  if (currentUserId && options.some((o) => o.userId === currentUserId)) {
    return [currentUserId];
  }
  return options[0]?.userId ? [options[0].userId] : [];
}

export function CreateRequestAssigneeSelect({
  teamId,
  idPrefix,
  disabled,
}: {
  teamId: string;
  idPrefix: string;
  disabled?: boolean;
  inputClass?: string;
}) {
  const me = useOptionalCurrentProfile();
  const [options, setOptions] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(() =>
    me?.userId ? [me.userId] : [],
  );

  const canAssign = me ? canAssignRequests(me.role) : false;

  useEffect(() => {
    if (!canAssign || !teamId) {
      setOptions([]);
      setAssignedUserIds(me?.userId ? [me.userId] : []);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    listAssigneeOptionsForCreate(teamId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setOptions([]);
        setAssignedUserIds(me?.userId ? [me.userId] : []);
        setLoadError(result.message);
        return;
      }
      setOptions(result.options);
      setAssignedUserIds((current) => {
        const validCurrent = current.filter((id) =>
          result.options.some((o) => o.userId === id),
        );
        return validCurrent.length > 0
          ? validCurrent
          : defaultAssigneeIds(result.options, me?.userId);
      });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [canAssign, teamId, me?.userId]);

  if (!canAssign) return null;

  return (
    <RequestAssigneeFormFields
      idPrefix={idPrefix}
      options={options}
      selectedIds={assignedUserIds}
      disabled={disabled || !teamId}
      loading={loading}
      loadError={loadError}
      onChange={setAssignedUserIds}
    />
  );
}
