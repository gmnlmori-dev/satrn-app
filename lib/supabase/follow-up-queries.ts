import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import {
  extractCalendarTasks,
  filterCalendarTasksByWindow,
  filterRequestsByFollowUpWindow,
  sortCalendarTaskEntries,
  type CalendarTaskEntry,
  type FollowUpChecklistWindow,
} from "@/lib/next-action-tasks";
import { inboxItemRowToInboxItem, requestRowToRequest } from "@/lib/supabase/mappers";
import { INBOX_SELECT_WITH_ASSIGNEE } from "@/lib/supabase/inbox-queries";
import { REQUEST_SELECT_WITH_ASSIGNEE } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InboxItemRowWithAssignee, RequestRowWithAssignee } from "@/types/database";
import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

async function getOpenRequestsForFollowUp(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT_WITH_ASSIGNEE)
    .neq("status", "closed");

  assertNoError("getOpenRequestsForFollowUp", error);
  return ((data ?? []) as RequestRowWithAssignee[]).map(requestRowToRequest);
}

/** Aperte in ritardo (scadenza effettiva prima di oggi). */
export async function getOverdueRequests(): Promise<Request[]> {
  const requests = await getOpenRequestsForFollowUp();
  return filterRequestsByFollowUpWindow(requests, "overdue");
}

/** Aperte con prossima azione oggi (scadenza effettiva). */
export async function getFollowUpTodayRequests(): Promise<Request[]> {
  const requests = await getOpenRequestsForFollowUp();
  return filterRequestsByFollowUpWindow(requests, "today");
}

/** Aperte con prossima azione da domani fino a fine settimana (scadenza effettiva). */
export async function getUpcomingRequests(): Promise<Request[]> {
  const requests = await getOpenRequestsForFollowUp();
  return filterRequestsByFollowUpWindow(requests, "upcoming");
}

/** Coda progetti per tutte le finestre (una sola query DB). */
export async function getFollowUpRequestQueues(): Promise<{
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
}> {
  const requests = await getOpenRequestsForFollowUp();
  const bounds = getFollowUpWindowBounds();
  return {
    overdue: filterRequestsByFollowUpWindow(requests, "overdue", bounds),
    today: filterRequestsByFollowUpWindow(requests, "today", bounds),
    upcoming: filterRequestsByFollowUpWindow(requests, "upcoming", bounds),
  };
}

/** Inbox da triage: nuovo/esaminato, non convertito, non archiviato. */
export async function getInboxTriageItems(): Promise<InboxItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select(INBOX_SELECT_WITH_ASSIGNEE)
    .in("status", ["new", "reviewed"])
    .is("linked_request_id", null)
    .order("created_at", { ascending: false });

  assertNoError("getInboxTriageItems", error);
  return ((data ?? []) as InboxItemRowWithAssignee[]).map(inboxItemRowToInboxItem);
}

/** Checklist con scadenza nella finestra, anche se il progetto non ha next_action_at. */
export async function getFollowUpChecklistEntries(
  window: FollowUpChecklistWindow,
): Promise<CalendarTaskEntry[]> {
  const requests = await getOpenRequestsForFollowUp();
  const entries = extractCalendarTasks(requests);
  return sortCalendarTaskEntries(filterCalendarTasksByWindow(entries, window));
}

/** Progetti aperti per conteggi dashboard (stessa base di Da seguire). */
export async function getOpenRequestsForOperationalCounts(): Promise<Request[]> {
  return getOpenRequestsForFollowUp();
}
