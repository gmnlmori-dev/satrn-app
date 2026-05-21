export type RequestStatus =
  | "new"
  | "in_review"
  | "waiting"
  | "follow_up"
  | "closed";

export type RequestPriority = "high" | "medium" | "low";

export interface Request {
  id: string;
  title: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  source: string;
  status: RequestStatus;
  priority: RequestPriority;
  description: string;
  nextAction: string;
  nextActionAt: string | null;
  lastInteractionAt: string;
  createdAt: string;
  updatedAt: string;
  /** Utente assegnato (`profiles.user_id`), se presente */
  assignedUserId: string | null;
  assignedAt: string | null;
  /** Nome mostrato in UI (priorità `full_name`, altrimenti email) */
  assignedToLabel: string | null;
  teamId: string;
}

export interface RequestNote {
  id: string;
  requestId: string;
  body: string;
  createdAt: string;
}
