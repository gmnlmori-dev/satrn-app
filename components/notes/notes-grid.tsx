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
      {notes.map((note) => (
        <div key={note.id} className="mb-3 inline-block w-full max-w-full break-inside-avoid">
          <NoteCard
            note={note}
            currentUserId={currentUserId}
            sharingOptions={sharingOptions}
            onUpdated={onNoteUpdated}
            onArchived={onNoteArchived}
            onDeleted={onNoteDeleted}
          />
        </div>
      ))}
    </div>
  );
}
