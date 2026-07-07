export type RequestStatus =
  | "new"
  | "in_review"
  | "waiting"
  | "follow_up"
  | "closed";

export type RequestPriority = "high" | "medium" | "low";

export type RequestAssignee = {
  userId: string;
  label: string;
  assignedAt: string;
};

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
  /** Tutti gli assegnatari del progetto */
  assignees: RequestAssignee[];
  /** Primo assegnatario (legacy / retrocompatibilità) */
  assignedUserId: string | null;
  assignedAt: string | null;
  /** Etichette assegnatari unite per tabelle e riepiloghi */
  assignedToLabel: string | null;
  teamId: string;
  teamName: string | null;
  createdByUserId: string | null;
  createdByLabel: string | null;
}

export interface RequestNote {
  id: string;
  requestId: string;
  body: string;
  createdAt: string;
}
