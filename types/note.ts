export type NoteVisibility = "private" | "team" | "shared";

export type NoteColor =
  | "default"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export interface TeamNote {
  id: string;
  teamId: string;
  createdByUserId: string;
  createdByLabel: string | null;
  title: string;
  body: string;
  visibility: NoteVisibility;
  isPinned: boolean;
  isArchived: boolean;
  color: NoteColor | null;
  sortOrder: number;
  sharedUserIds: string[];
  sharedTeamIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type NotesTabFilter = "mine" | "shared_with_me" | "team" | "archived";
