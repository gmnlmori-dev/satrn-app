import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import { inboxItemRowToInboxItem, requestRowToRequest } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InboxItemRow, RequestRow } from "@/types/database";
import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

/** Aperte con scadenza prima di oggi (calendario locale). */
export async function getOverdueRequests(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { startTodayIso } = getFollowUpWindowBounds();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .neq("status", "closed")
    .not("next_action_at", "is", null)
    .lt("next_action_at", startTodayIso)
    .order("next_action_at", { ascending: true });

  assertNoError("getOverdueRequests", error);
  return ((data ?? []) as RequestRow[]).map(requestRowToRequest);
}

/** Aperte con prossima azione oggi. */
export async function getFollowUpTodayRequests(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { startTodayIso, startTomorrowIso } = getFollowUpWindowBounds();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .neq("status", "closed")
    .gte("next_action_at", startTodayIso)
    .lt("next_action_at", startTomorrowIso)
    .order("next_action_at", { ascending: true });

  assertNoError("getFollowUpTodayRequests", error);
  return ((data ?? []) as RequestRow[]).map(requestRowToRequest);
}

/** Aperte con prossima azione da domani fino a fine giornata tra 7 giorni (inclusi). */
export async function getUpcomingRequests(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { startTomorrowIso, endWeekIso } = getFollowUpWindowBounds();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .neq("status", "closed")
    .not("next_action_at", "is", null)
    .gte("next_action_at", startTomorrowIso)
    .lte("next_action_at", endWeekIso)
    .order("next_action_at", { ascending: true });

  assertNoError("getUpcomingRequests", error);
  return ((data ?? []) as RequestRow[]).map(requestRowToRequest);
}

/** Inbox da triage: nuovo/esaminato, non convertito, non archiviato. */
export async function getInboxTriageItems(): Promise<InboxItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .in("status", ["new", "reviewed"])
    .is("linked_request_id", null)
    .order("created_at", { ascending: false });

  assertNoError("getInboxTriageItems", error);
  return ((data ?? []) as InboxItemRow[]).map(inboxItemRowToInboxItem);
}
