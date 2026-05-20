import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import { requestActivityRowToActivity, requestRowToRequest } from "@/lib/supabase/mappers";
import { REQUEST_SELECT_WITH_ASSIGNEE } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RequestActivityRow, RequestRowWithAssignee } from "@/types/database";
import type { RequestActivity } from "@/types/activity";
import type { Request } from "@/types/request";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

export type DashboardOperationalCounts = {
  overdue: number;
  today: number;
  upcomingWeek: number;
  inboxTriage: number;
};

export type DashboardMineCounts = {
  overdue: number;
  today: number;
  upcomingWeek: number;
};

function requestCountQuery(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bounds: ReturnType<typeof getFollowUpWindowBounds>,
  window: "overdue" | "today" | "upcoming",
  assignedUserId?: string,
) {
  const { startTodayIso, startTomorrowIso, endWeekIso } = bounds;
  let q = supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .neq("status", "closed");

  if (assignedUserId) {
    q = q.eq("assigned_user_id", assignedUserId);
  }

  if (window === "overdue") {
    return q
      .not("next_action_at", "is", null)
      .lt("next_action_at", startTodayIso);
  }
  if (window === "today") {
    return q
      .gte("next_action_at", startTodayIso)
      .lt("next_action_at", startTomorrowIso);
  }
  return q
    .not("next_action_at", "is", null)
    .gte("next_action_at", startTomorrowIso)
    .lte("next_action_at", endWeekIso);
}

/** Conteggi allineati alla vista «Da seguire» (stessi filtri). */
export async function getDashboardOperationalCounts(): Promise<DashboardOperationalCounts> {
  const supabase = await createSupabaseServerClient();
  const bounds = getFollowUpWindowBounds();

  const [overdue, today, upcoming, inbox] = await Promise.all([
    requestCountQuery(supabase, bounds, "overdue"),
    requestCountQuery(supabase, bounds, "today"),
    requestCountQuery(supabase, bounds, "upcoming"),
    supabase
      .from("inbox_items")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "reviewed"])
      .is("linked_request_id", null),
  ]);

  assertNoError("dashboard overdue count", overdue.error);
  assertNoError("dashboard today count", today.error);
  assertNoError("dashboard upcoming count", upcoming.error);
  assertNoError("dashboard inbox count", inbox.error);

  return {
    overdue: overdue.count ?? 0,
    today: today.count ?? 0,
    upcomingWeek: upcoming.count ?? 0,
    inboxTriage: inbox.count ?? 0,
  };
}

/** Stesse finestre temporali, solo richieste assegnate all’utente. */
export async function getDashboardMineCounts(
  userId: string,
): Promise<DashboardMineCounts | null> {
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  const bounds = getFollowUpWindowBounds();

  const [overdue, today, upcoming] = await Promise.all([
    requestCountQuery(supabase, bounds, "overdue", userId),
    requestCountQuery(supabase, bounds, "today", userId),
    requestCountQuery(supabase, bounds, "upcoming", userId),
  ]);

  assertNoError("dashboard mine overdue count", overdue.error);
  assertNoError("dashboard mine today count", today.error);
  assertNoError("dashboard mine upcoming count", upcoming.error);

  return {
    overdue: overdue.count ?? 0,
    today: today.count ?? 0,
    upcomingWeek: upcoming.count ?? 0,
  };
}

export type DashboardActivityItem = RequestActivity & {
  requestTitle: string | null;
};

/** Ultime attività globali (timeline), con titolo richiesta se disponibile. */
export async function getRecentActivitiesGlobal(
  limit = 10,
): Promise<DashboardActivityItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("request_activities")
    .select(
      `
      *,
      requests ( title )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  assertNoError("getRecentActivitiesGlobal", error);

  return ((data ?? []) as (RequestActivityRow & {
    requests: { title: string } | null;
  })[]).map((row) => {
    const base = requestActivityRowToActivity(row);
    const title = row.requests?.title ?? null;
    return { ...base, requestTitle: title };
  });
}

/** Richieste aperte ordinate per ultimo aggiornamento. */
export async function getRecentlyUpdatedRequests(
  limit = 6,
): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT_WITH_ASSIGNEE)
    .neq("status", "closed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  assertNoError("getRecentlyUpdatedRequests", error);
  return ((data ?? []) as RequestRowWithAssignee[]).map(requestRowToRequest);
}

/** Almeno una richiesta nel DB (per empty state). */
export async function getRequestsTotalCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true });

  assertNoError("getRequestsTotalCount", error);
  return count ?? 0;
}
