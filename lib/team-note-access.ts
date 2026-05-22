import type { NoteColor, NoteVisibility, NotesTabFilter, TeamNote } from "@/types/note";

export function titleFromBody(body: string, title?: string): string {
  const trimmedTitle = (title ?? "").trim();
  if (trimmedTitle) return trimmedTitle;
  return (body.split(/\r?\n/)[0] ?? "").trim();
}

export function canEditTeamNote(note: TeamNote, userId: string): boolean {
  return note.createdByUserId === userId;
}

export function noteVisibilityLabel(visibility: NoteVisibility): string {
  switch (visibility) {
    case "private":
      return "Privata";
    case "team":
      return "Team";
    case "shared":
      return "Condivisa";
  }
}

export function filterNotesByTab(
  notes: TeamNote[],
  tab: NotesTabFilter,
  userId: string,
): TeamNote[] {
  switch (tab) {
    case "archived":
      return notes.filter((n) => n.isArchived);
    case "mine":
      return notes.filter(
        (n) => !n.isArchived && n.createdByUserId === userId,
      );
    case "shared_with_me":
      return notes.filter(
        (n) =>
          !n.isArchived &&
          n.visibility === "shared" &&
          n.createdByUserId !== userId &&
          n.sharedUserIds.includes(userId),
      );
    case "team":
      return notes.filter(
        (n) => !n.isArchived && n.visibility === "team",
      );
  }
}

export function filterNotesBySearch(notes: TeamNote[], query: string): TeamNote[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((n) => {
    const haystack = `${n.title}\n${n.body}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function sortNotesForGrid(notes: TeamNote[]): TeamNote[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export const NOTE_COLOR_OPTIONS: {
  value: NoteColor;
  label: string;
  cardClass: string;
  swatchClass: string;
}[] = [
  {
    value: "default",
    label: "Predefinito",
    cardClass: "bg-surface",
    swatchClass: "bg-surface border border-line-default",
  },
  {
    value: "yellow",
    label: "Giallo",
    cardClass: "bg-[#fef9c3] dark:bg-[#422006]/50",
    swatchClass: "bg-[#fef08a]",
  },
  {
    value: "green",
    label: "Verde",
    cardClass: "bg-[#dcfce7] dark:bg-[#052e16]/50",
    swatchClass: "bg-[#86efac]",
  },
  {
    value: "blue",
    label: "Blu",
    cardClass: "bg-[#dbeafe] dark:bg-[#172554]/50",
    swatchClass: "bg-[#93c5fd]",
  },
  {
    value: "purple",
    label: "Viola",
    cardClass: "bg-[#f3e8ff] dark:bg-[#3b0764]/50",
    swatchClass: "bg-[#d8b4fe]",
  },
  {
    value: "pink",
    label: "Rosa",
    cardClass: "bg-[#fce7f3] dark:bg-[#500724]/50",
    swatchClass: "bg-[#f9a8d4]",
  },
];

export function noteColorCardClass(color: NoteColor | null | undefined): string {
  const match = NOTE_COLOR_OPTIONS.find((c) => c.value === color);
  return match?.cardClass ?? NOTE_COLOR_OPTIONS[0].cardClass;
}

export function parseNoteColor(raw: string | null | undefined): NoteColor | null {
  if (!raw) return null;
  return NOTE_COLOR_OPTIONS.some((c) => c.value === raw)
    ? (raw as NoteColor)
    : null;
}
