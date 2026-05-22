import type { RequestActivityType } from "@/types/activity";
import type { AppRole } from "@/types/profile";
import type { InboxItemStatus } from "@/types/inbox";
import type { RequestPriority, RequestStatus } from "@/types/request";

/** Riga tabella `public.teams`. */
export type TeamRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Riga tabella `public.profiles`. */
export type ProfileRow = {
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
  team_id: string;
  preferences?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRowWithTeam = ProfileRow & {
  team?: Pick<TeamRow, "id" | "name" | "slug"> | null;
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
  created_by_user_id: string | null;
  team_id: string;
};

export type RequestAssigneeRowWithProfile = {
  user_id: string;
  assigned_at: string;
  assigned_by_user_id: string | null;
  assignee?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
};

/** Risultato select con FK verso profiles (alias `assignee`, `creator`) e team. */
export type RequestRowWithAssignee = RequestRow & {
  request_assignees?: RequestAssigneeRowWithProfile[] | null;
  assignee?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
  creator?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
  team?: {
    id: string;
    name: string;
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
  team_id: string;
  assigned_user_id: string | null;
  assigned_at: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type InboxItemRowWithAssignee = InboxItemRow & {
  assignee?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
};

export type TeamNoteVisibility = "private" | "team" | "shared";

/** Riga tabella `public.team_notes`. */
export type TeamNoteRow = {
  id: string;
  team_id: string;
  created_by_user_id: string;
  title: string;
  body: string;
  visibility: TeamNoteVisibility;
  is_pinned: boolean;
  is_archived: boolean;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TeamNoteSharedUserRow = {
  note_id: string;
  user_id: string;
};

export type TeamNoteRowWithRelations = TeamNoteRow & {
  creator?: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
  team_note_shared_users?: { user_id: string }[];
};
