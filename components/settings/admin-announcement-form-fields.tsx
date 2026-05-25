"use client";

import { useId } from "react";
import {
  AdminFormSection,
  AdminUserTeamFields,
  RequiredMark,
  adminUserInputClass,
} from "@/components/settings/admin-user-form-fields";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { announcementAudienceLabel } from "@/lib/labels";
import { toDatetimeLocalValue } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiFormLabel } from "@/lib/typography";
import type { AnnouncementAudience } from "@/types/announcement";
import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
  { value: "all", label: announcementAudienceLabel.all },
  { value: "team", label: announcementAudienceLabel.team },
  { value: "user", label: announcementAudienceLabel.user },
];

export type AnnouncementFormState = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  targetTeamId: string;
  targetUserId: string;
  startsAt: string;
  endsAt: string;
};

export function emptyAnnouncementFormState(
  teams: TeamSelectOption[],
): AnnouncementFormState {
  return {
    title: "",
    body: "",
    audience: "all",
    targetTeamId: teams[0]?.id ?? "",
    targetUserId: "",
    startsAt: "",
    endsAt: "",
  };
}

export function announcementFormStateFromAnnouncement(
  announcement: {
    title: string;
    body: string;
    audience: AnnouncementAudience;
    targetTeamId: string | null;
    targetUserId: string | null;
    startsAt: string | null;
    endsAt: string | null;
  },
  teams: TeamSelectOption[],
): AnnouncementFormState {
  return {
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    targetTeamId: announcement.targetTeamId ?? teams[0]?.id ?? "",
    targetUserId: announcement.targetUserId ?? "",
    startsAt: toDatetimeLocalValue(announcement.startsAt),
    endsAt: toDatetimeLocalValue(announcement.endsAt),
  };
}

export function AdminAnnouncementFormFields({
  state,
  onChange,
  teams,
  profiles,
  disabled,
  idPrefix = "announcement",
}: {
  state: AnnouncementFormState;
  onChange: (patch: Partial<AnnouncementFormState>) => void;
  teams: TeamSelectOption[];
  profiles: ProfileSummary[];
  disabled?: boolean;
  idPrefix?: string;
}) {
  const titleId = `${idPrefix}-title`;
  const bodyId = `${idPrefix}-body`;
  const startsId = `${idPrefix}-starts`;
  const endsId = `${idPrefix}-ends`;
  const userSelectId = useId();

  const profileOptions = profiles
    .filter((profile) => profile.isActive)
    .map((profile) => ({
      userId: profile.userId,
      label:
        profile.fullName.trim() ||
        profile.email.trim() ||
        profile.userId.slice(0, 8),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "it"));

  return (
    <>
      <AdminFormSection title="Contenuto">
        <div className="space-y-3">
          <div>
            <label htmlFor={titleId} className={uiFormLabel}>
              Titolo <RequiredMark />
            </label>
            <input
              id={titleId}
              required
              disabled={disabled}
              value={state.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className={adminUserInputClass}
              placeholder="Es. Nuove scadenze in calendario"
            />
          </div>
          <div>
            <label htmlFor={bodyId} className={uiFormLabel}>
              Note di aggiornamento <RequiredMark />
            </label>
            <textarea
              id={bodyId}
              required
              rows={8}
              disabled={disabled}
              value={state.body}
              onChange={(e) => onChange({ body: e.target.value })}
              className={cn(adminUserInputClass, "min-h-[10rem] resize-y")}
              placeholder="Descrivi cosa è cambiato nell'app…"
            />
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection title="Destinatari">
        <div className="space-y-3">
          <SegmentedControl<AnnouncementAudience>
            ariaLabel="Destinatari novità"
            value={state.audience}
            options={audienceOptions}
            onChange={(value) => onChange({ audience: value })}
          />
          {state.audience === "team" ? (
            <AdminUserTeamFields
              idPrefix={`${idPrefix}-team`}
              teamId={state.targetTeamId}
              teams={teams}
              onTeamChange={(targetTeamId) => onChange({ targetTeamId })}
              disabled={disabled}
            />
          ) : null}
          {state.audience === "user" ? (
            <div>
              <label htmlFor={userSelectId} className={uiFormLabel}>
                Utente <RequiredMark />
              </label>
              <select
                id={userSelectId}
                disabled={disabled}
                value={state.targetUserId}
                onChange={(e) => onChange({ targetUserId: e.target.value })}
                className={adminUserInputClass}
              >
                <option value="">Seleziona utente…</option>
                {profileOptions.map((option) => (
                  <option key={option.userId} value={option.userId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </AdminFormSection>

      <AdminFormSection title="Finestra di visibilità">
        <p className="mb-3 text-sm text-fg-secondary">
          Lascia vuoto per attivazione immediata o senza scadenza.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={startsId} className={uiFormLabel}>
              Attiva dal
            </label>
            <input
              id={startsId}
              type="datetime-local"
              disabled={disabled}
              value={state.startsAt}
              onChange={(e) => onChange({ startsAt: e.target.value })}
              className={adminUserInputClass}
            />
          </div>
          <div>
            <label htmlFor={endsId} className={uiFormLabel}>
              Disattiva il
            </label>
            <input
              id={endsId}
              type="datetime-local"
              disabled={disabled}
              value={state.endsAt}
              onChange={(e) => onChange({ endsAt: e.target.value })}
              className={adminUserInputClass}
            />
          </div>
        </div>
      </AdminFormSection>
    </>
  );
}

export function announcementFormStateToInput(state: AnnouncementFormState) {
  return {
    title: state.title,
    body: state.body,
    audience: state.audience,
    target_team_id: state.audience === "team" ? state.targetTeamId : undefined,
    target_user_id: state.audience === "user" ? state.targetUserId : undefined,
    starts_at: state.startsAt || null,
    ends_at: state.endsAt || null,
  };
}
