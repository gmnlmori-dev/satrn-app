import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import { requestActivityRowToActivity, requestRowToRequest } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RequestActivityRow, RequestRow } from "@/types/database";
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

/** Conteggi allineati alla vista «Da seguire» (stessi filtri). */
export async function getDashboardOperationalCounts(): Promise<DashboardOperationalCounts> {
  const supabase = await createSupabaseServerClient();
  const { startTodayIso, startTomorrowIso, endWeekIso } =
    getFollowUpWindowBounds();

  const [overdue, today, upcoming, inbox] = await Promise.all([
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed")
      .not("next_action_at", "is", null)
      .lt("next_action_at", startTodayIso),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed")
      .gte("next_action_at", startTodayIso)
      .lt("next_action_at", startTomorrowIso),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed")
      .not("next_action_at", "is", null)
      .gte("next_action_at", startTomorrowIso)
      .lte("next_action_at", endWeekIso),
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
    .select("*")
    .neq("status", "closed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  assertNoError("getRecentlyUpdatedRequests", error);
  return ((data ?? []) as RequestRow[]).map(requestRowToRequest);
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
