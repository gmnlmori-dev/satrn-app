"use client";

import { useEffect, useMemo, useState } from "react";
import { NoteCard } from "@/components/notes/note-card";
import type { TeamNote } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

type NotesGridProps = {
  notes: TeamNote[];
  currentUserId: string;
  teamId?: string;
  sharingOptions: AssigneeOption[];
  draftOpen?: boolean;
  onDraftCreated?: (note: TeamNote) => void;
  onNoteUpdated?: (note: TeamNote) => void;
  onNoteArchived?: (noteId: string) => void;
  onNoteDeleted?: (noteId: string) => void;
  onCollapseDraft?: () => void;
};

type GridItem = { kind: "draft" } | { kind: "note"; note: TeamNote };

function useNotesColumnCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1280) setCount(4);
      else if (w >= 1024) setCount(3);
      else if (w >= 640) setCount(2);
      else setCount(1);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function distributeItems(items: GridItem[], columnCount: number): GridItem[][] {
  const columns = Array.from({ length: columnCount }, () => [] as GridItem[]);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
}

export function NotesGrid({
  notes,
  currentUserId,
  teamId,
  sharingOptions,
  draftOpen = false,
  onDraftCreated,
  onNoteUpdated,
  onNoteArchived,
  onNoteDeleted,
  onCollapseDraft,
}: NotesGridProps) {
  const columnCount = useNotesColumnCount();

  const items = useMemo(() => {
    const list: GridItem[] = [];
    if (draftOpen) list.push({ kind: "draft" });
    for (const note of notes) {
      list.push({ kind: "note", note });
    }
    return list;
  }, [draftOpen, notes]);

  const columns = useMemo(
    () => distributeItems(items, columnCount),
    [items, columnCount],
  );

  return (
    <div className="flex items-start gap-3">
      {columns.map((columnItems, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-1 flex-col gap-3"
        >
          {columnItems.map((item) =>
            item.kind === "draft" ? (
              <NoteCard
                key="draft"
                draft
                currentUserId={currentUserId}
                teamId={teamId}
                sharingOptions={sharingOptions}
                autoFocus
                onDraftCreated={onDraftCreated}
                onUpdated={onNoteUpdated}
                onCollapseDraft={onCollapseDraft}
              />
            ) : (
              <NoteCard
                key={item.note.id}
                note={item.note}
                currentUserId={currentUserId}
                sharingOptions={sharingOptions}
                onUpdated={onNoteUpdated}
                onArchived={onNoteArchived}
                onDeleted={onNoteDeleted}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
