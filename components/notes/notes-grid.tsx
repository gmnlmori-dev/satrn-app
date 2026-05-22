"use client";

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
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {draftOpen ? (
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
      ) : null}
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          currentUserId={currentUserId}
          sharingOptions={sharingOptions}
          onUpdated={onNoteUpdated}
          onArchived={onNoteArchived}
          onDeleted={onNoteDeleted}
        />
      ))}
    </div>
  );
}
