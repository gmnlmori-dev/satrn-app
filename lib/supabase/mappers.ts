import type { RequestNoteRow, RequestRow } from "@/types/database";
import type { Request, RequestNote } from "@/types/request";

export function requestRowToRequest(row: RequestRow): Request {
  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    source: row.source,
    status: row.status,
    priority: row.priority,
    description: row.description,
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    lastInteractionAt: row.last_interaction_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function requestNoteRowToNote(row: RequestNoteRow): RequestNote {
  return {
    id: row.id,
    requestId: row.request_id,
    body: row.body,
    createdAt: row.created_at,
  };
}
