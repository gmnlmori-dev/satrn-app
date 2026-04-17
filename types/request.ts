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
}

export interface RequestNote {
  id: string;
  requestId: string;
  body: string;
  createdAt: string;
}
