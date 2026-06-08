"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { NoteCard } from "@/components/notes/note-card";
import { cn } from "@/lib/cn";
import { uiControl, uiTransition } from "@/lib/ui-classes";
import { canEditTeamNote } from "@/lib/team-note-access";
import type { NoteSharingTeamOption } from "@/lib/actions/list-note-sharing-teams";
import type { TeamNote } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

type NotesGridProps = {
  notes: TeamNote[];
  currentUserId: string;
  teamId?: string;
  sharingOptions: AssigneeOption[];
  teamSharingOptions?: NoteSharingTeamOption[];
  draftOpen?: boolean;
  composerTriggerOpen?: boolean;
  onOpenComposer?: () => void;
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

type DropEdge = "top" | "bottom" | "left" | "right";

type DropTarget = {
  id: string;
  before: boolean;
  edge: DropEdge;
};

const DRAG_THRESHOLD_PX = 8;

function dropEdgeFromPointer(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): { before: boolean; edge: DropEdge } {
  const distTop = clientY - rect.top;
  const distBottom = rect.bottom - clientY;
  const distLeft = clientX - rect.left;
  const distRight = rect.right - clientX;
  const min = Math.min(distTop, distBottom, distLeft, distRight);

  if (min === distTop) return { before: true, edge: "top" };
  if (min === distBottom) return { before: false, edge: "bottom" };
  if (min === distLeft) return { before: true, edge: "left" };
  return { before: false, edge: "right" };
}

function isInteractiveDragTarget(target: EventTarget | null) {
  return Boolean(
    (target as HTMLElement | null)?.closest(
      "button, a, input, textarea, select, label, [role='button'], [role='menuitem'], [contenteditable='true']",
    ),
  );
}

function getNotesColumnCount(): number {
  if (typeof window === "undefined") return 4;
  if (window.matchMedia("(min-width: 768px)").matches) return 4;
  if (window.matchMedia("(min-width: 640px)").matches) return 2;
  return 1;
}

function subscribeNotesColumnCount(onChange: () => void) {
  const queries = [
    window.matchMedia("(min-width: 768px)"),
    window.matchMedia("(min-width: 640px)"),
  ];
  for (const query of queries) {
    query.addEventListener("change", onChange);
  }
  return () => {
    for (const query of queries) {
      query.removeEventListener("change", onChange);
    }
  };
}

function useNotesColumnCount() {
  return useSyncExternalStore(
    subscribeNotesColumnCount,
    getNotesColumnCount,
    () => 4,
  );
}

function splitNotesIntoColumns(items: TeamNote[], columnCount: number): TeamNote[][] {
  const columns = Array.from({ length: columnCount }, () => [] as TeamNote[]);
  for (let index = 0; index < items.length; index += 1) {
    columns[index % columnCount]?.push(items[index]!);
  }
  return columns;
}

export function NotesGrid({
  notes,
  currentUserId,
  teamId,
  sharingOptions,
  teamSharingOptions = [],
  draftOpen = false,
  composerTriggerOpen = false,
  onOpenComposer,
  reorderEnabled = true,
  onDraftCreated,
  onNoteUpdated,
  onNoteArchived,
  onNoteDeleted,
  onCollapseDraft,
  onReorder,
}: NotesGridProps) {
  const columnCount = useNotesColumnCount();
  const noteColumns = useMemo(
    () => splitNotesIntoColumns(notes, columnCount),
    [notes, columnCount],
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingPinned, setDraggingPinned] = useState<boolean | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const notesRef = useRef(notes);
  const onReorderRef = useRef(onReorder);
  const draggingIdRef = useRef<string | null>(null);
  const draggingPinnedRef = useRef<boolean | null>(null);
  const suppressExpandRef = useRef<Set<string>>(new Set());
  const pointerDragRef = useRef<{
    noteId: string;
    pinned: boolean;
    startX: number;
    startY: number;
    active: boolean;
    pointerId: number;
  } | null>(null);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  const resetDrag = useCallback(() => {
    draggingIdRef.current = null;
    draggingPinnedRef.current = null;
    pointerDragRef.current = null;
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

  const resolveDropTarget = useCallback(
    (clientX: number, clientY: number): DropTarget | null => {
      const draggingId = draggingIdRef.current;
      const draggingPinned = draggingPinnedRef.current;
      if (!draggingId || draggingPinned === null) return null;

      const wrappers = document.querySelectorAll<HTMLElement>("[data-note-id]");
      let best: DropTarget | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const wrapper of wrappers) {
        const targetId = wrapper.dataset.noteId;
        if (!targetId || targetId === draggingId) continue;

        const targetNote = notesRef.current.find((n) => n.id === targetId);
        if (!targetNote || !canEditTeamNote(targetNote, currentUserId)) continue;
        if (targetNote.isPinned !== draggingPinned) continue;

        const rect = wrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(clientX - centerX, clientY - centerY);

        if (distance < bestDistance) {
          bestDistance = distance;
          const { before, edge } = dropEdgeFromPointer(rect, clientX, clientY);
          best = { id: targetId, before, edge };
        }
      }

      return best;
    },
    [currentUserId],
  );

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      const drag = pointerDragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      const dx = Math.abs(e.clientX - drag.startX);
      const dy = Math.abs(e.clientY - drag.startY);

      if (!drag.active) {
        if (dx < DRAG_THRESHOLD_PX && dy < DRAG_THRESHOLD_PX) return;
        drag.active = true;
        draggingIdRef.current = drag.noteId;
        draggingPinnedRef.current = drag.pinned;
        setDraggingId(drag.noteId);
        setDraggingPinned(drag.pinned);
      }

      e.preventDefault();
      setDropTarget(resolveDropTarget(e.clientX, e.clientY));
    };

    const finishDrag = (e: PointerEvent) => {
      const drag = pointerDragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      if (drag.active) {
        const target = resolveDropTarget(e.clientX, e.clientY);
        if (target && target.id !== drag.noteId) {
          onReorderRef.current?.(drag.noteId, target.id, target.before);
        }
        suppressExpandRef.current.add(drag.noteId);
        window.setTimeout(() => {
          suppressExpandRef.current.delete(drag.noteId);
        }, 400);
      }

      resetDrag();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [resolveDropTarget, resetDrag]);

  const handlePointerDown = useCallback(
    (note: TeamNote) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canDragNote(note)) return;
      if (e.button !== 0) return;
      if (isInteractiveDragTarget(e.target)) return;

      pointerDragRef.current = {
        noteId: note.id,
        pinned: note.isPinned,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        pointerId: e.pointerId,
      };
    },
    [canDragNote],
  );

  const renderNote = (note: TeamNote) => {
    const draggable = canDragNote(note);
    const isDragging = draggingId === note.id;
    const dropEdge = dropTarget?.id === note.id ? dropTarget.edge : null;
    const pinMismatch =
      draggingPinned !== null &&
      draggingId !== note.id &&
      note.isPinned !== draggingPinned;

    return (
      <div
        key={note.id}
        data-note-id={note.id}
        className={cn(
          "relative min-w-0",
          draggable && "cursor-grab touch-none select-none active:cursor-grabbing",
          isDragging && "z-20 opacity-50 pointer-events-none",
          pinMismatch && Boolean(draggingId) && "opacity-40",
        )}
        onPointerDown={handlePointerDown(note)}
        onClickCapture={(e) => {
          if (suppressExpandRef.current.has(note.id)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {dropEdge === "top" ? (
          <div className="pointer-events-none absolute -top-1.5 left-2 right-2 z-30 h-0.5 rounded-full bg-accent" />
        ) : null}
        {dropEdge === "bottom" ? (
          <div className="pointer-events-none absolute -bottom-1.5 left-2 right-2 z-30 h-0.5 rounded-full bg-accent" />
        ) : null}
        {dropEdge === "left" ? (
          <div className="pointer-events-none absolute -left-1.5 top-2 bottom-2 z-30 w-0.5 rounded-full bg-accent" />
        ) : null}
        {dropEdge === "right" ? (
          <div className="pointer-events-none absolute -right-1.5 top-2 bottom-2 z-30 w-0.5 rounded-full bg-accent" />
        ) : null}
        <NoteCard
          note={note}
          currentUserId={currentUserId}
          sharingOptions={sharingOptions}
          teamSharingOptions={teamSharingOptions}
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
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-start gap-3">
        {noteColumns.map((columnNotes, columnIndex) => (
          <div
            key={columnIndex}
            className="flex min-w-0 flex-1 flex-col gap-3"
          >
            {columnIndex === 0 && draftOpen ? (
              <div className="relative min-w-0">
                <NoteCard
                  draft
                  currentUserId={currentUserId}
                  teamId={teamId}
                  sharingOptions={sharingOptions}
                  teamSharingOptions={teamSharingOptions}
                  autoFocus
                  onDraftCreated={onDraftCreated}
                  onUpdated={onNoteUpdated}
                  onCollapseDraft={onCollapseDraft}
                />
              </div>
            ) : null}
            {columnIndex === 0 && composerTriggerOpen && onOpenComposer ? (
              <button
                type="button"
                onClick={onOpenComposer}
                className={cn(
                  uiControl,
                  uiTransition,
                  "w-full py-3 text-left text-sm text-fg-tertiary shadow-sm hover:shadow-md",
                )}
              >
                Prendi una nota…
              </button>
            ) : null}
            {columnNotes.map((note) => renderNote(note))}
          </div>
        ))}
      </div>
    </div>
  );
}
