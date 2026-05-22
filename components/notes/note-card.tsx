"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { archiveTeamNote } from "@/lib/actions/archive-team-note";
import { deleteTeamNote } from "@/lib/actions/delete-team-note";
import { updateTeamNote } from "@/lib/actions/update-team-note";
import { updateTeamNoteSharing } from "@/lib/actions/update-team-note-sharing";
import { cn } from "@/lib/cn";
import {
  canEditTeamNote,
  NOTE_COLOR_OPTIONS,
  noteColorCardClass,
  noteVisibilityLabel,
  titleFromBody,
} from "@/lib/team-note-access";
import { useTeamNoteAutosave } from "@/lib/use-team-note-autosave";
import {
  uiBtnIcon,
  uiControl,
  uiFocusRingInset,
} from "@/lib/ui-classes";
import type { TeamNote, NoteColor, NoteVisibility } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

function AutosaveIndicator({
  status,
  errorMessage,
}: {
  status: "idle" | "saving" | "saved" | "error";
  errorMessage: string | null;
}) {
  if (status === "idle") return null;
  if (status === "error") {
    return (
      <span className="text-xs text-danger" role="status">
        {errorMessage ?? "Errore salvataggio"}
      </span>
    );
  }
  return (
    <span className="text-xs text-fg-tertiary" role="status" aria-live="polite">
      {status === "saving" ? "Salvataggio…" : "Salvato"}
    </span>
  );
}

type NoteCardProps = {
  note?: TeamNote;
  currentUserId: string;
  teamId?: string;
  draft?: boolean;
  sharingOptions?: AssigneeOption[];
  autoFocus?: boolean;
  onDraftCreated?: (note: TeamNote) => void;
  onUpdated?: (note: TeamNote) => void;
  onArchived?: (noteId: string) => void;
  onDeleted?: (noteId: string) => void;
  onCollapseDraft?: () => void;
};

function NoteActionsMenu({
  onShare,
  onArchive,
  onDelete,
  onClose,
  pending,
}: {
  onShare: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClose?: () => void;
  pending: boolean;
}) {
  return (
    <div className="min-w-[180px] rounded-lg border border-line-default bg-surface py-1 shadow-lg">
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-fg-secondary hover:bg-elevated"
        onClick={() => {
          onShare();
          onClose?.();
        }}
      >
        Condividi
      </button>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-fg-secondary hover:bg-elevated"
        onClick={() => {
          void onArchive();
          onClose?.();
        }}
        disabled={pending}
      >
        Archivia
      </button>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-danger hover:bg-elevated"
        onClick={() => {
          void onDelete();
          onClose?.();
        }}
        disabled={pending}
      >
        Elimina
      </button>
    </div>
  );
}

export function NoteCard({
  note,
  currentUserId,
  teamId = "",
  draft = false,
  sharingOptions = [],
  autoFocus = false,
  onDraftCreated,
  onUpdated,
  onArchived,
  onDeleted,
  onCollapseDraft,
}: NoteCardProps) {
  const [expanded, setExpanded] = useState(draft);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [localNote, setLocalNote] = useState<TeamNote | null>(note ?? null);
  const [visibility, setVisibility] = useState<NoteVisibility>(
    note?.visibility ?? "private",
  );
  const [sharedUserIds, setSharedUserIds] = useState<string[]>(
    note?.sharedUserIds ?? [],
  );
  const [actionPending, setActionPending] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const editable =
    draft || (localNote ? canEditTeamNote(localNote, currentUserId) : false);

  const autosave = useTeamNoteAutosave({
    noteId: localNote?.id ?? null,
    initialTitle: note?.title ?? "",
    initialBody: note?.body ?? "",
    enabled: editable && expanded,
    onCreated: (id, payload) => {
      const created: TeamNote = {
        id,
        teamId: localNote?.teamId ?? teamId,
        createdByUserId: currentUserId,
        createdByLabel: null,
        title: payload.title,
        body: payload.body,
        visibility: "private",
        isPinned: false,
        isArchived: false,
        color: null,
        sharedUserIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalNote(created);
      onDraftCreated?.(created);
    },
  });

  useEffect(() => {
    if (note) {
      setLocalNote(note);
      setVisibility(note.visibility);
      setSharedUserIds(note.sharedUserIds);
    }
  }, [note]);

  useEffect(() => {
    if (!autoFocus || !expanded) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [autoFocus, expanded]);

  const displayTitle =
    titleFromBody(
      editable && expanded ? autosave.body : (localNote?.body ?? ""),
      editable && expanded ? autosave.title : (localNote?.title ?? ""),
    ) || "Nota senza titolo";

  const previewBody = editable && expanded ? autosave.body : (localNote?.body ?? "");

  async function handlePinToggle() {
    if (!localNote || actionPending) return;
    setActionPending(true);
    try {
      const next = !localNote.isPinned;
      const result = await updateTeamNote(localNote.id, { isPinned: next });
      if (result.ok) {
        const updated = { ...localNote, isPinned: next, updatedAt: result.updatedAt };
        setLocalNote(updated);
        onUpdated?.(updated);
      }
    } finally {
      setActionPending(false);
    }
  }

  async function handleColorChange(color: NoteColor) {
    if (!localNote || actionPending) return;
    setActionPending(true);
    try {
      const result = await updateTeamNote(localNote.id, { color });
      if (result.ok) {
        const updated = {
          ...localNote,
          color,
          updatedAt: result.updatedAt,
        };
        setLocalNote(updated);
        onUpdated?.(updated);
      }
    } finally {
      setActionPending(false);
    }
  }

  async function handleArchive() {
    if (!localNote || actionPending) return;
    setActionPending(true);
    try {
      const result = await archiveTeamNote(localNote.id);
      if (result.ok) {
        onArchived?.(localNote.id);
        setExpanded(false);
      }
    } finally {
      setActionPending(false);
      setMenuOpen(false);
    }
  }

  async function handleDelete() {
    if (!localNote || actionPending) return;
    if (
      !window.confirm(
        "Eliminare questa nota? L'azione non può essere annullata.",
      )
    ) {
      return;
    }
    setActionPending(true);
    try {
      const result = await deleteTeamNote(localNote.id);
      if (result.ok) {
        onDeleted?.(localNote.id);
      }
    } finally {
      setActionPending(false);
      setMenuOpen(false);
    }
  }

  const persistSharing = useCallback(
    async (nextVisibility: NoteVisibility, nextShared: string[]) => {
      if (!localNote) return;
      setActionPending(true);
      try {
        const result = await updateTeamNoteSharing(
          localNote.id,
          nextVisibility,
          nextShared,
        );
        if (result.ok) {
          const updated = {
            ...localNote,
            visibility: nextVisibility,
            sharedUserIds: nextShared,
          };
          setLocalNote(updated);
          onUpdated?.(updated);
        }
      } finally {
        setActionPending(false);
      }
    },
    [localNote, onUpdated],
  );

  async function handleVisibilityChange(next: NoteVisibility) {
    setVisibility(next);
    if (next !== "shared") {
      setSharedUserIds([]);
      if (localNote) await persistSharing(next, []);
    }
  }

  function toggleSharedUser(userId: string) {
    setSharedUserIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      if (localNote && visibility === "shared") {
        void persistSharing("shared", next);
      }
      return next;
    });
  }

  const cardColor = noteColorCardClass(localNote?.color);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border border-line-default shadow-sm transition-shadow",
        cardColor,
        expanded ? "col-span-1" : "cursor-pointer hover:shadow-md",
        draft && "ring-1 ring-accent/30",
      )}
      onClick={() => {
        if (!expanded && !draft) setExpanded(true);
      }}
    >
      <div className="flex min-h-[120px] flex-1 flex-col p-3.5 sm:p-4">
        {!expanded && !draft ? (
          <>
            {editable && localNote ? (
              <div
                className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={menuOpen}
                    aria-label="Azioni nota"
                    className={cn(uiBtnIcon, "h-8 w-8 bg-surface/90 shadow-sm")}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-full mt-1">
                      <NoteActionsMenu
                        pending={actionPending}
                        onShare={() => {
                          setExpanded(true);
                          setSharingOpen(true);
                        }}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        onClose={() => setMenuOpen(false)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {localNote?.isPinned ? (
              <span className="mb-1 inline-flex text-fg-tertiary" aria-label="Fissata">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6l1.4 1 1.4-1v-6H18v-2l-2-2z" />
                </svg>
              </span>
            ) : null}
            <h3 className="line-clamp-2 text-sm font-medium text-fg-primary">
              {displayTitle}
            </h3>
            {previewBody ? (
              <p className="mt-1.5 line-clamp-6 whitespace-pre-wrap text-sm text-fg-secondary">
                {previewBody}
              </p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <span className="rounded-full bg-canvas/70 px-2 py-0.5 text-[11px] font-medium text-fg-tertiary">
                {noteVisibilityLabel(localNote?.visibility ?? "private")}
              </span>
              {localNote?.createdByLabel && localNote.createdByUserId !== currentUserId ? (
                <span className="truncate text-[11px] text-fg-tertiary">
                  {localNote.createdByLabel}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <>
            {editable ? (
              <textarea
                ref={titleRef}
                value={autosave.title}
                onChange={(e) => autosave.setTitle(e.target.value)}
                rows={1}
                placeholder="Titolo"
                className={cn(
                  uiControl,
                  "mb-2 resize-none border-transparent bg-transparent px-0 py-0 text-sm font-medium shadow-none focus:border-line-default",
                )}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className="mb-2 text-sm font-medium text-fg-primary">{displayTitle}</h3>
            )}

            {editable ? (
              <textarea
                value={autosave.body}
                onChange={(e) => autosave.setBody(e.target.value)}
                rows={6}
                placeholder="Prendi una nota…"
                className={cn(
                  uiControl,
                  "min-h-[100px] flex-1 resize-none border-transparent bg-transparent px-0 py-0 text-sm shadow-none focus:border-line-default",
                )}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-fg-secondary">{previewBody}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {editable && localNote ? (
                  <>
                    <button
                      type="button"
                      aria-label={localNote.isPinned ? "Rimuovi pin" : "Fissa in alto"}
                      className={cn(uiBtnIcon, "h-8 w-8", localNote.isPinned && "text-accent")}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handlePinToggle();
                      }}
                      disabled={actionPending}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6l1.4 1 1.4-1v-6H18v-2l-2-2z" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-0.5">
                      {NOTE_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          aria-label={c.label}
                          className={cn(
                            uiFocusRingInset,
                            "h-5 w-5 rounded-full",
                            c.swatchClass,
                            localNote.color === c.value && "ring-2 ring-accent ring-offset-1",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleColorChange(c.value);
                          }}
                          disabled={actionPending}
                        />
                      ))}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        aria-expanded={menuOpen}
                        aria-label="Altre azioni"
                        className={cn(uiBtnIcon, "h-8 w-8")}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen((v) => !v);
                          setSharingOpen(false);
                        }}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      {menuOpen ? (
                        <div
                          className="absolute bottom-full left-0 z-10 mb-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <NoteActionsMenu
                            pending={actionPending}
                            onShare={() => setSharingOpen(true)}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            onClose={() => setMenuOpen(false)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <span className="rounded-full bg-canvas/70 px-2 py-0.5 text-[11px] font-medium text-fg-tertiary">
                    {noteVisibilityLabel(localNote?.visibility ?? "private")}
                    {!editable ? " · sola lettura" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AutosaveIndicator
                  status={autosave.status}
                  errorMessage={autosave.errorMessage}
                />
                {!draft ? (
                  <button
                    type="button"
                    className={cn(uiBtnIcon, "h-8 w-8 opacity-60 hover:opacity-100")}
                    aria-label="Chiudi"
                    onClick={(e) => {
                      e.stopPropagation();
                      autosave.flushSave();
                      if (localNote) {
                        const synced = {
                          ...localNote,
                          title: titleFromBody(autosave.body, autosave.title),
                          body: autosave.body,
                        };
                        setLocalNote(synced);
                        onUpdated?.(synced);
                      }
                      setExpanded(false);
                      setSharingOpen(false);
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : onCollapseDraft ? (
                  <button
                    type="button"
                    className={cn(uiBtnIcon, "h-8 w-8")}
                    aria-label="Chiudi"
                    onClick={(e) => {
                      e.stopPropagation();
                      autosave.flushSave();
                      if (localNote) {
                        const synced = {
                          ...localNote,
                          title: titleFromBody(autosave.body, autosave.title),
                          body: autosave.body,
                        };
                        setLocalNote(synced);
                        onUpdated?.(synced);
                      }
                      onCollapseDraft();
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>

            {sharingOpen && editable && localNote ? (
              <div
                className="mt-3 rounded-lg border border-line-default bg-canvas/60 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-medium text-fg-primary">Condivisione</p>
                <select
                  value={visibility}
                  onChange={(e) => void handleVisibilityChange(e.target.value as NoteVisibility)}
                  className={cn(uiControl, "mt-2 w-full py-2 text-sm")}
                  disabled={actionPending}
                >
                  <option value="private">Privata</option>
                  <option value="team">Tutto il team</option>
                  <option value="shared">Utenti specifici</option>
                </select>
                {visibility === "shared" ? (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {sharingOptions.map((opt) => (
                      <li key={opt.userId}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-elevated">
                          <input
                            type="checkbox"
                            checked={sharedUserIds.includes(opt.userId)}
                            onChange={() => toggleSharedUser(opt.userId)}
                            disabled={actionPending}
                          />
                          <span className="text-sm text-fg-secondary">{opt.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
