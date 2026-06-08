"use client";

import { AdminCreateTeamSelect } from "@/components/app/admin-create-team-select";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { NoteSharingUserSelect } from "@/components/notes/note-sharing-user-select";
import { cn } from "@/lib/cn";
import { noteVisibilityLabel } from "@/lib/team-note-access";
import { uiControl } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { NoteSharingTeamOption } from "@/lib/actions/list-note-sharing-teams";
import type { NoteVisibility } from "@/types/note";

const VISIBILITY_OPTIONS: {
  value: NoteVisibility;
  label: string;
  hint: string;
}[] = [
  { value: "private", label: "Privata", hint: "Visibile solo a te." },
  { value: "team", label: "Team", hint: "Visibile a tutti i membri del team." },
  {
    value: "shared",
    label: "Condivisa",
    hint: "Visibile agli utenti o ai team selezionati (sola lettura per loro).",
  },
];

type NoteSharingFieldsProps = {
  visibility: NoteVisibility;
  sharedUserIds: string[];
  sharedTeamIds?: string[];
  teamSharingOptions?: NoteSharingTeamOption[];
  userFilterTeamId?: string;
  onUserFilterTeamChange?: (teamId: string) => void;
  onVisibilityChange: (visibility: NoteVisibility) => void;
  onSharedUserIdsChange: (userIds: string[]) => void;
  onToggleSharedTeam?: (teamId: string) => void;
  disabled?: boolean;
  compact?: boolean;
  idPrefix?: string;
  className?: string;
};

export function NoteSharingFields({
  visibility,
  sharedUserIds,
  sharedTeamIds = [],
  teamSharingOptions = [],
  userFilterTeamId,
  onUserFilterTeamChange,
  onVisibilityChange,
  onSharedUserIdsChange,
  onToggleSharedTeam,
  disabled = false,
  compact = false,
  idPrefix = "note-sharing",
  className,
}: NoteSharingFieldsProps) {
  const me = useOptionalCurrentProfile();
  const isAdmin = me?.role === "admin";
  const showUserTeamFilter =
    isAdmin && onUserFilterTeamChange !== undefined && visibility === "shared";
  const resolvedUserTeamId =
    userFilterTeamId ?? me?.teamId ?? "";
  const activeHint =
    VISIBILITY_OPTIONS.find((opt) => opt.value === visibility)?.hint ?? "";

  return (
    <div className={cn(compact ? "min-w-0 space-y-2.5" : "space-y-3", className)}>
      <div>
        {!compact ? (
          <label htmlFor={`${idPrefix}-visibility`} className={uiFormLabel}>
            Visibilità
          </label>
        ) : null}
        {compact ? (
          <div
            role="radiogroup"
            aria-label="Visibilità nota"
            className="flex min-w-0 w-full rounded-lg border border-line-default bg-canvas/50 p-0.5"
          >
            {VISIBILITY_OPTIONS.map((opt) => {
              const selected = visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onVisibilityChange(opt.value)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors",
                    selected
                      ? "bg-surface text-fg-primary shadow-sm"
                      : "text-fg-tertiary hover:text-fg-secondary",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <select
            id={`${idPrefix}-visibility`}
            value={visibility}
            onChange={(e) => onVisibilityChange(e.target.value as NoteVisibility)}
            className={cn(uiControl, "mt-1.5 w-full py-2 text-sm")}
            disabled={disabled}
          >
            <option value="private">Privata — solo tu</option>
            <option value="team">Team — tutti nel team</option>
            <option value="shared">Condivisa — utenti specifici</option>
          </select>
        )}
        <p className="mt-1.5 text-xs text-fg-tertiary">{activeHint}</p>
      </div>

      {visibility === "shared" ? (
        <div
          className={cn(
            showUserTeamFilter && !compact && "grid gap-3 sm:grid-cols-2",
            showUserTeamFilter && compact && "space-y-2.5",
          )}
        >
          {showUserTeamFilter ? (
            <AdminCreateTeamSelect
              idPrefix={`${idPrefix}-user-team`}
              disabled={disabled}
              inputClass={cn(uiControl, compact ? "py-2 text-sm" : "py-2.5 text-[15px]")}
              teamId={resolvedUserTeamId}
              onTeamChange={onUserFilterTeamChange}
            />
          ) : null}
          <NoteSharingUserSelect
            key={resolvedUserTeamId}
            teamId={resolvedUserTeamId}
            idPrefix={`${idPrefix}-users`}
            disabled={disabled}
            selectedIds={sharedUserIds}
            onChange={onSharedUserIdsChange}
          />
        </div>
      ) : null}

      {visibility === "shared" && teamSharingOptions.length > 0 ? (
        <div>
          <p className={uiFormLabel}>Team con accesso</p>
          <ul className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-line-default bg-canvas/50 p-1">
            {teamSharingOptions.map((team) => {
              const checked = sharedTeamIds.includes(team.id);
              return (
                <li key={team.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5",
                      checked ? "bg-accent/10" : "hover:bg-elevated",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSharedTeam?.(team.id)}
                      disabled={disabled}
                    />
                    <span className="text-sm text-fg-secondary">{team.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {!compact ? (
        <p className="text-xs text-fg-tertiary">
          Stato attuale: <span className="font-medium">{noteVisibilityLabel(visibility)}</span>
        </p>
      ) : null}
    </div>
  );
}
