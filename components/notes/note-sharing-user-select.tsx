"use client";

import { useEffect, useState } from "react";
import { RequestAssigneesField } from "@/components/requests/request-assignees-field";
import { listNoteSharingOptions } from "@/lib/actions/list-note-sharing-options";
import { uiFormLabel } from "@/lib/typography";
import type { AssigneeOption } from "@/types/profile";

export function NoteSharingUserSelect({
  teamId,
  idPrefix,
  disabled,
  selectedIds,
  onChange,
}: {
  teamId: string;
  idPrefix: string;
  disabled?: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [options, setOptions] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setOptions([]);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    listNoteSharingOptions(teamId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setOptions([]);
          setLoadError(result.message);
          return;
        }
        setOptions(result.options);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return (
    <div>
      <p className={uiFormLabel}>Utenti con accesso</p>
      <RequestAssigneesField
        idPrefix={idPrefix}
        options={options}
        selectedIds={selectedIds}
        disabled={disabled || loading || !teamId}
        onChange={onChange}
        className={loading ? "opacity-70" : undefined}
      />
      {loadError ? (
        <p className="mt-1.5 text-xs text-danger">{loadError}</p>
      ) : null}
    </div>
  );
}
