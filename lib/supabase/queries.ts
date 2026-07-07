import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  requestNoteRowToNote,
  requestRowToRequest,
} from "@/lib/supabase/mappers";
import type { RequestNoteRow, RequestRowWithAssignee } from "@/types/database";
import type { Request, RequestNote } from "@/types/request";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

export const REQUEST_SELECT_WITH_ASSIGNEE = `
  *,
  request_assignees (
    user_id,
    assigned_at,
    assigned_by_user_id,
    assignee:profiles!request_assignees_user_id_fkey (
      user_id,
      full_name,
      email
    )
  ),
  assignee:profiles!requests_assigned_user_id_fkey (
    user_id,
    full_name,
    email
  ),
  creator:profiles!requests_created_by_user_id_fkey (
    user_id,
    full_name,
    email
  ),
  team:teams!requests_team_id_fkey (
    id,
    name
  )
`;

/** Tutti i progetti, ultimo aggiornamento per primo. */
export async function getRequests(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT_WITH_ASSIGNEE)
    .order("updated_at", { ascending: false });

  assertNoError("getRequests", error);
  return ((data ?? []) as RequestRowWithAssignee[]).map(requestRowToRequest);
}

/** Singolo progetto per id, o `null` se assente. */
export async function getRequestById(id: string): Promise<Request | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT_WITH_ASSIGNEE)
    .eq("id", id)
    .maybeSingle();

  assertNoError("getRequestById", error);
  if (!data) return null;
  return requestRowToRequest(data as RequestRowWithAssignee);
}

/** Note collegate a un progetto (cronologia). */
export async function getRequestNotes(requestId: string): Promise<RequestNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("request_notes")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  assertNoError("getRequestNotes", error);
  return ((data ?? []) as RequestNoteRow[]).map(requestNoteRowToNote);
}
