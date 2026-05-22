"use client";

import { cn } from "@/lib/cn";
import { noteVisibilityLabel } from "@/lib/team-note-access";
import { uiControl } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { NoteVisibility } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

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
  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3", className)}>
      <div>
        <label htmlFor={`${idPrefix}-visibility`} className={uiFormLabel}>
          Visibilità
        </label>
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
        <p className="mt-1 text-xs text-fg-tertiary">
          {visibility === "private"
            ? "Visibile solo a te."
            : visibility === "team"
              ? "Visibile a tutti i membri del team."
              : "Visibile agli utenti selezionati (sola lettura per loro)."}
        </p>
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
