"use client";

import { useCallback, useState } from "react";
import { NoteCard } from "@/components/notes/note-card";
import { cn } from "@/lib/cn";
import { canEditTeamNote } from "@/lib/team-note-access";
import type { TeamNote } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

type NotesGridProps = {
  notes: TeamNote[];
  currentUserId: string;
  teamId?: string;
  sharingOptions: AssigneeOption[];
  draftOpen?: boolean;
  reorderEnabled?: boolean;
  onDraftCreated?: (note: TeamNote) => void;
  onNoteUpdated?: (note: TeamNote) => void;
  onNoteArchived?: (noteId: string) => void;
  onNoteDeleted?: (noteId: string) => void;
  onCollapseDraft?: () => void;
  onReorder?: (
    draggedId: string,
    targetId: string,
    insertBefore: boolean,
  ) => void;
};

function DragHandleIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="7" r="1.4" />
      <circle cx="15" cy="7" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="17" r="1.4" />
      <circle cx="15" cy="17" r="1.4" />
    </svg>
  );
}

type DropTarget = {
  id: string;
  before: boolean;
};

export function NotesGrid({
  notes,
  currentUserId,
  teamId,
  sharingOptions,
  draftOpen = false,
  reorderEnabled = true,
  onDraftCreated,
  onNoteUpdated,
  onNoteArchived,
  onNoteDeleted,
  onCollapseDraft,
  onReorder,
}: NotesGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingPinned, setDraggingPinned] = useState<boolean | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const resetDrag = useCallback(() => {
    setDraggingId(null);
    setDraggingPinned(null);
    setDropTarget(null);
  }, []);

  const canDragNote = useCallback(
    (note: TeamNote) =>
      reorderEnabled &&
      onReorder !== undefined &&
      canEditTeamNote(note, currentUserId) &&
      expandedNoteId !== note.id,
    [reorderEnabled, onReorder, currentUserId, expandedNoteId],
  );

  const handleDragStart = useCallback(
    (note: TeamNote) => (e: React.DragEvent) => {
      if (!canDragNote(note)) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", note.id);
      e.dataTransfer.effectAllowed = "move";
      setDraggingId(note.id);
      setDraggingPinned(note.isPinned);
    },
    [canDragNote],
  );

  const handleDragOver = useCallback(
    (note: TeamNote) => (e: React.DragEvent) => {
      if (!draggingId || draggingPinned === null || draggingId === note.id) return;
      if (note.isPinned !== draggingPinned) return;
      if (!canEditTeamNote(note, currentUserId)) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      setDropTarget({ id: note.id, before });
    },
    [draggingId, draggingPinned, currentUserId],
  );

  const handleDrop = useCallback(
    (note: TeamNote) => (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggingId || !dropTarget || dropTarget.id !== note.id) {
        resetDrag();
        return;
      }
      if (draggingId !== dropTarget.id) {
        onReorder?.(draggingId, dropTarget.id, dropTarget.before);
      }
      resetDrag();
    },
    [draggingId, dropTarget, onReorder, resetDrag],
  );

  return (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
      {draftOpen ? (
        <div className="mb-3 inline-block w-full max-w-full break-inside-avoid">
          <NoteCard
            draft
            currentUserId={currentUserId}
            teamId={teamId}
            sharingOptions={sharingOptions}
            autoFocus
            onDraftCreated={onDraftCreated}
            onUpdated={onNoteUpdated}
            onCollapseDraft={onCollapseDraft}
          />
        </div>
      ) : null}
      {notes.map((note) => {
        const draggable = canDragNote(note);
        const isDragging = draggingId === note.id;
        const isDropBefore = dropTarget?.id === note.id && dropTarget.before;
        const isDropAfter = dropTarget?.id === note.id && !dropTarget.before;
        const pinMismatch =
          draggingPinned !== null &&
          draggingId !== note.id &&
          note.isPinned !== draggingPinned;

        return (
          <div
            key={note.id}
            className={cn(
              "relative mb-3 inline-block w-full max-w-full break-inside-avoid",
              isDragging && "opacity-50",
              pinMismatch && draggingId && "opacity-40",
            )}
            onDragOver={handleDragOver(note)}
            onDrop={handleDrop(note)}
          >
            {isDropBefore ? (
              <div className="absolute -top-1.5 left-2 right-2 z-10 h-0.5 rounded-full bg-accent" />
            ) : null}
            {draggable ? (
              <div
                draggable
                onDragStart={handleDragStart(note)}
                onDragEnd={resetDrag}
                className="mb-1 flex cursor-grab items-center justify-center rounded-md py-0.5 text-fg-tertiary active:cursor-grabbing hover:bg-canvas/80 hover:text-fg-secondary"
                aria-label="Trascina per riordinare"
                title="Trascina per riordinare"
                onClick={(e) => e.stopPropagation()}
              >
                <DragHandleIcon />
              </div>
            ) : null}
            <NoteCard
              note={note}
              currentUserId={currentUserId}
              sharingOptions={sharingOptions}
              onUpdated={onNoteUpdated}
              onArchived={onNoteArchived}
              onDeleted={onNoteDeleted}
              onExpandedChange={(expanded) => {
                setExpandedNoteId((prev) => {
                  if (expanded) return note.id;
                  return prev === note.id ? null : prev;
                });
              }}
            />
            {isDropAfter ? (
              <div className="absolute -bottom-1.5 left-2 right-2 z-10 h-0.5 rounded-full bg-accent" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
