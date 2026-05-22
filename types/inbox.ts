export type InboxItemStatus =
  | "new"
  | "reviewed"
  | "converted"
  | "archived";

export interface InboxItem {
  id: string;
  source: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  rawContent: string;
  status: InboxItemStatus;
  linkedRequestId: string | null;
  teamId: string;
  assignedUserId: string | null;
  assignedAt: string | null;
  assignedToLabel: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
