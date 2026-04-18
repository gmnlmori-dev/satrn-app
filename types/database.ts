import type { InboxItemStatus } from "@/types/inbox";
import type { RequestPriority, RequestStatus } from "@/types/request";

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
