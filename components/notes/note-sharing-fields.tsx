"use client";

import { cn } from "@/lib/cn";
import { noteVisibilityLabel } from "@/lib/team-note-access";
import { uiControl } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { NoteVisibility } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

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
    hint: "Visibile agli utenti selezionati (sola lettura per loro).",
  },
];

type NoteSharingFieldsProps = {
  visibility: NoteVisibility;
  sharedUserIds: string[];
  sharingOptions: AssigneeOption[];
  onVisibilityChange: (visibility: NoteVisibility) => void;
  onToggleSharedUser: (userId: string) => void;
  disabled?: boolean;
  compact?: boolean;
  idPrefix?: string;
  className?: string;
};

export function NoteSharingFields({
  visibility,
  sharedUserIds,
  sharingOptions,
  onVisibilityChange,
  onToggleSharedUser,
  disabled = false,
  compact = false,
  idPrefix = "note-sharing",
  className,
}: NoteSharingFieldsProps) {
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
        <div>
          <p className={uiFormLabel}>Utenti con accesso</p>
          {sharingOptions.length === 0 ? (
            <p className="mt-1 text-xs text-fg-tertiary">
              Nessun altro utente attivo nel team.
            </p>
          ) : (
            <ul className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-line-default bg-canvas/50 p-1">
              {sharingOptions.map((opt) => {
                const checked = sharedUserIds.includes(opt.userId);
                return (
                  <li key={opt.userId}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5",
                        checked ? "bg-accent/10" : "hover:bg-elevated",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSharedUser(opt.userId)}
                        disabled={disabled}
                      />
                      <span className="text-sm text-fg-secondary">{opt.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
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
