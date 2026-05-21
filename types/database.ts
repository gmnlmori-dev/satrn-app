import type { RequestActivityType } from "@/types/activity";
import type { AppRole } from "@/types/profile";
import type { InboxItemStatus } from "@/types/inbox";
import type { RequestPriority, RequestStatus } from "@/types/request";

/** Riga tabella `public.profiles`. */
export type ProfileRow = {
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
  preferences?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** Riga tabella `public.requests` (snake_case come in Postgres). */
export type RequestRow = {
  id: string;
  title: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  source: string;
  status: RequestStatus;
  priority: RequestPriority;
  description: string;
  next_action: string;
  next_action_at: string | null;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
  assigned_user_id: string | null;
  assigned_at: string | null;
};

/** Risultato select con FK verso profiles (alias `assignee`). */
export type RequestRowWithAssignee = RequestRow & {
  assignee?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
};

/** Riga tabella `public.request_activities`. */
export type RequestActivityRow = {
  id: string;
  request_id: string;
  type: RequestActivityType;
  body: string;
  meta: Record<string, unknown> | null;
  created_at: string;
};

/** Riga tabella `public.request_notes`. */
export type RequestNoteRow = {
  id: string;
  request_id: string;
  body: string;
  created_at: string;
};

/** Riga tabella `public.inbox_items`. */
export type InboxItemRow = {
  id: string;
  source: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  raw_content: string;
  status: InboxItemStatus;
  linked_request_id: string | null;
  created_at: string;
  updated_at: string;
};
