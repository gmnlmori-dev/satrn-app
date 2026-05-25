"use client";

import { useState } from "react";
import { adminCreateAnnouncement } from "@/lib/actions/admin-create-announcement";
import {
  AdminAnnouncementFormFields,
  announcementFormStateToInput,
  emptyAnnouncementFormState,
  type AnnouncementFormState,
} from "@/components/settings/admin-announcement-form-fields";
import { AdminFormSection } from "@/components/settings/admin-user-form-fields";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

export function AdminAnnouncementCreateForm({
  teams,
  profiles,
  onSuccess,
  onCancel,
}: {
  teams: TeamSelectOption[];
  profiles: ProfileSummary[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AnnouncementFormState>(() =>
    emptyAnnouncementFormState(teams),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const result = await adminCreateAnnouncement(
        announcementFormStateToInput(state),
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pr-4 sm:pr-5">
        <div className="min-h-0 flex-1 divide-y divide-line-default overflow-y-auto pb-4 pr-3.5 sm:pr-5">
          <AdminAnnouncementFormFields
            state={state}
            onChange={(patch) => setState((current) => ({ ...current, ...patch }))}
            teams={teams}
            profiles={profiles}
            disabled={pending}
            idPrefix="create-announcement"
          />
        </div>

        <div className="shrink-0 border-t border-line-default bg-surface pr-3.5 sm:pr-5 pt-4">
          {error ? (
            <p role="alert" className="mb-3 text-sm leading-relaxed text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              className={cn(uiBtnSecondary, "w-full sm:w-auto")}
              onClick={onCancel}
              disabled={pending}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className={cn(uiBtnPrimary, pending && "cursor-wait opacity-90")}
            >
              {pending ? "Creazione…" : "Pubblica novità"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
