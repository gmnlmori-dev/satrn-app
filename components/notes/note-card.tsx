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
import { NoteSharingFields } from "@/components/notes/note-sharing-fields";
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

function PinIcon({ pinned }: { pinned: boolean }) {
  if (pinned) {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6l1.4 1 1.4-1v-6H18v-2l-2-2z" />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17v5m-4-3h8M8 3h8l1 9.5-4 4-4-4L8 3z"
      />
    </svg>
  );
}

function ColorCheckIcon() {
  return (
    <svg className="h-3 w-3 text-fg-primary" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
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
  const [pinPending, setPinPending] = useState(false);
  const [colorPending, setColorPending] = useState<NoteColor | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const editable =
    draft || (localNote ? canEditTeamNote(localNote, currentUserId) : false);

  const autosave = useTeamNoteAutosave({
    noteId: localNote?.id ?? null,
    initialTitle: (note ?? localNote)?.title ?? "",
    initialBody: (note ?? localNote)?.body ?? "",
    visibility,
    sharedUserIds,
    enabled: editable && expanded,
    onCreated: (id, payload) => {
      const created: TeamNote = {
        id,
        teamId: localNote?.teamId ?? teamId,
        createdByUserId: currentUserId,
        createdByLabel: null,
        title: payload.title,
        body: payload.body,
        visibility: payload.visibility,
        isPinned: false,
        isArchived: false,
        color: null,
        sharedUserIds: payload.sharedUserIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalNote(created);
      setVisibility(payload.visibility);
      setSharedUserIds(payload.sharedUserIds);
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
    const t = window.setTimeout(() => {
      if (draft) {
        bodyRef.current?.focus();
      } else {
        titleRef.current?.focus();
      }
    }, 50);
    return () => window.clearTimeout(t);
  }, [autoFocus, expanded, draft]);

  const displayTitle =
    titleFromBody(
      editable && expanded ? autosave.body : (localNote?.body ?? ""),
      editable && expanded ? autosave.title : (localNote?.title ?? ""),
    ) || "Nota senza titolo";

  const previewBody = editable && expanded ? autosave.body : (localNote?.body ?? "");

  async function handlePinToggle() {
    if (!localNote || pinPending) return;
    const next = !localNote.isPinned;
    const previous = localNote.isPinned;
    setLocalNote({ ...localNote, isPinned: next });
    setPinPending(true);
    try {
      const result = await updateTeamNote(localNote.id, { isPinned: next });
      if (!result.ok) {
        setLocalNote({ ...localNote, isPinned: previous });
        return;
      }
      const updated = { ...localNote, isPinned: next, updatedAt: result.updatedAt };
      setLocalNote(updated);
      onUpdated?.(updated);
    } finally {
      setPinPending(false);
    }
  }

  async function handleColorChange(color: NoteColor) {
    if (!localNote || colorPending) return;
    const dbColor = color === "default" ? null : color;
    const previous = localNote.color;
    setLocalNote({ ...localNote, color: dbColor });
    setColorPending(color);
    try {
      const result = await updateTeamNote(localNote.id, { color: dbColor });
      if (!result.ok) {
        setLocalNote({ ...localNote, color: previous });
        return;
      }
      const updated = {
        ...localNote,
        color: dbColor,
        updatedAt: result.updatedAt,
      };
      setLocalNote(updated);
      onUpdated?.(updated);
    } finally {
      setColorPending(null);
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
    const nextShared = next === "shared" ? sharedUserIds : [];
    if (next !== "shared") {
      setSharedUserIds([]);
    }
    if (localNote?.id) {
      await persistSharing(next, next !== "shared" ? [] : nextShared);
    }
  }

  function toggleSharedUser(userId: string) {
    setSharedUserIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      if (localNote?.id && visibility === "shared") {
        void persistSharing("shared", next);
      }
      return next;
    });
  }

  const cardColor = noteColorCardClass(localNote?.color);
  const activeColor = localNote?.color ?? "default";
  const isPinned = localNote?.isPinned ?? false;

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
                ref={bodyRef}
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
                {editable ? (
                  <>
                    {localNote ? (
                      <>
                        <button
                          type="button"
                          aria-label={isPinned ? "Rimuovi pin" : "Fissa in alto"}
                          aria-pressed={isPinned}
                          title={isPinned ? "Fissata in alto" : "Fissa in alto"}
                          className={cn(
                            uiBtnIcon,
                            "h-8 w-8 transition-all",
                            isPinned
                              ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                              : "text-fg-tertiary hover:bg-elevated hover:text-fg-primary",
                            pinPending && "animate-pulse opacity-70",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handlePinToggle();
                          }}
                          disabled={pinPending}
                        >
                          <PinIcon pinned={isPinned} />
                        </button>
                        <div
                          className="flex items-center gap-1 rounded-lg bg-canvas/60 px-1 py-0.5"
                          role="group"
                          aria-label="Colore nota"
                        >
                          {NOTE_COLOR_OPTIONS.map((c) => {
                            const selected = activeColor === c.value;
                            const saving = colorPending === c.value;
                            return (
                              <button
                                key={c.value}
                                type="button"
                                aria-label={c.label}
                                aria-pressed={selected}
                                title={c.label}
                                className={cn(
                                  uiFocusRingInset,
                                  "relative flex h-6 w-6 items-center justify-center rounded-full transition-all",
                                  c.swatchClass,
                                  selected && "ring-2 ring-accent ring-offset-1 scale-110",
                                  saving && "animate-pulse opacity-60",
                                  colorPending && !saving && !selected && "opacity-40",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selected) return;
                                  void handleColorChange(c.value);
                                }}
                                disabled={Boolean(colorPending)}
                              >
                                {selected ? <ColorCheckIcon /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                    <button
                      type="button"
                      aria-expanded={sharingOpen}
                      aria-label="Visibilità e condivisione"
                      title={noteVisibilityLabel(visibility)}
                      className={cn(
                        uiBtnIcon,
                        "h-8 w-8",
                        sharingOpen && "bg-accent/15 text-accent",
                        visibility !== "private" && "text-accent",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingOpen((v) => !v);
                        setMenuOpen(false);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                    </button>
                    {localNote ? (
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
                    ) : null}
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

            {sharingOpen && editable ? (
              <div
                className="mt-3 rounded-lg border border-line-default bg-canvas/60 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <NoteSharingFields
                  compact
                  visibility={visibility}
                  sharedUserIds={sharedUserIds}
                  sharingOptions={sharingOptions}
                  onVisibilityChange={(v) => void handleVisibilityChange(v)}
                  onToggleSharedUser={toggleSharedUser}
                  disabled={actionPending}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
