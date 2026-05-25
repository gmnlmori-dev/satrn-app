import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import { countOpenTasksByWindow, type OpenTaskWindowCounts } from "@/lib/next-action-tasks";
import { requestActivityRowToActivity, requestRowToRequest } from "@/lib/supabase/mappers";
import { REQUEST_SELECT_WITH_ASSIGNEE } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  scopesToTeam,
  teamIdForScope,
  type TeamQueryScope,
} from "@/lib/supabase/team-scope";
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

export type { OpenTaskWindowCounts as DashboardMineTaskCounts };

function requestCountQuery(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bounds: ReturnType<typeof getFollowUpWindowBounds>,
  window: "overdue" | "today" | "upcoming",
  scope: TeamQueryScope,
  assignedUserId?: string,
) {
  const { startTodayIso, startTomorrowIso, endWeekIso } = bounds;
  const teamId = teamIdForScope(scope);

  let q = assignedUserId
    ? supabase
        .from("requests")
        .select("id, request_assignees!inner(user_id)", {
          count: "exact",
          head: true,
        })
        .neq("status", "closed")
        .eq("request_assignees.user_id", assignedUserId)
    : supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .neq("status", "closed");

  if (teamId) {
    q = q.eq("team_id", teamId);
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

/** Conteggi allineati alla vista «Da seguire» (stessi filtri), scoped per team. */
export async function getDashboardOperationalCounts(
  scope: TeamQueryScope,
): Promise<DashboardOperationalCounts> {
  const supabase = await createSupabaseServerClient();
  const bounds = getFollowUpWindowBounds();
  const teamId = teamIdForScope(scope);

  let inboxQuery = supabase
    .from("inbox_items")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "reviewed"])
    .is("linked_request_id", null);

  if (teamId) {
    inboxQuery = inboxQuery.eq("team_id", teamId);
  }

  const [overdue, today, upcoming, inbox] = await Promise.all([
    requestCountQuery(supabase, bounds, "overdue", scope),
    requestCountQuery(supabase, bounds, "today", scope),
    requestCountQuery(supabase, bounds, "upcoming", scope),
    inboxQuery,
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

/** Stesse finestre temporali, solo richieste assegnate all’utente (nel proprio team). */
export async function getDashboardMineCounts(
  userId: string,
  scope: TeamQueryScope,
): Promise<DashboardMineCounts | null> {
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  const bounds = getFollowUpWindowBounds();

  const [overdue, today, upcoming] = await Promise.all([
    requestCountQuery(supabase, bounds, "overdue", scope, userId),
    requestCountQuery(supabase, bounds, "today", scope, userId),
    requestCountQuery(supabase, bounds, "upcoming", scope, userId),
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

/** Task checklist aperti sulle richieste assegnate all'utente. */
export async function getDashboardMineTaskCounts(
  userId: string,
  scope: TeamQueryScope,
): Promise<OpenTaskWindowCounts | null> {
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  const teamId = teamIdForScope(scope);

  let q = supabase
    .from("requests")
    .select("next_action, request_assignees!inner(user_id)")
    .neq("status", "closed")
    .eq("request_assignees.user_id", userId);

  if (teamId) {
    q = q.eq("team_id", teamId);
  }

  const { data, error } = await q;

  assertNoError("dashboard mine task counts", error);

  const raws = ((data ?? []) as { next_action: string }[]).map(
    (row) => row.next_action ?? "",
  );

  return countOpenTasksByWindow(raws, getFollowUpWindowBounds());
}

export type DashboardActivityItem = RequestActivity & {
  requestTitle: string | null;
  requestTeamId: string;
  requestTeamName: string | null;
  assignedUserIds: string[];
};

/** Ultime attività (timeline), con titolo richiesta se disponibile. */
export async function getRecentActivitiesGlobal(
  scope: TeamQueryScope,
  limit = 10,
): Promise<DashboardActivityItem[]> {
  const supabase = await createSupabaseServerClient();
  const teamId = teamIdForScope(scope);
  const requestSelect = `
    title,
    team_id,
    assigned_user_id,
    request_assignees ( user_id ),
    team:teams!requests_team_id_fkey ( name )
  `;
  const select = teamId
    ? `
      *,
      requests!inner (
        ${requestSelect}
      )
    `
    : `
      *,
      requests (
        ${requestSelect}
      )
    `;

  let q = supabase
    .from("request_activities")
    .select(select)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (teamId) {
    q = q.eq("requests.team_id", teamId);
  }

  const { data, error } = await q;

  assertNoError("getRecentActivitiesGlobal", error);

  return ((data ?? []) as (RequestActivityRow & {
    requests: {
      title: string;
      team_id: string;
      assigned_user_id: string | null;
      request_assignees: { user_id: string }[] | null;
      team: { name: string } | null;
    } | null;
  })[]).map((row) => {
    const base = requestActivityRowToActivity(row);
    const req = row.requests;
    const junctionIds =
      req?.request_assignees?.map((entry) => entry.user_id) ?? [];
    const assignedUserIds =
      junctionIds.length > 0
        ? junctionIds
        : req?.assigned_user_id
          ? [req.assigned_user_id]
          : [];
    return {
      ...base,
      requestTitle: req?.title ?? null,
      requestTeamId: req?.team_id ?? "",
      requestTeamName: req?.team?.name ?? null,
      assignedUserIds,
    };
  });
}

/** Richieste aperte ordinate per ultimo aggiornamento. */
export async function getRecentlyUpdatedRequests(
  scope: TeamQueryScope,
  limit = 6,
): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const teamId = teamIdForScope(scope);

  let q = supabase
    .from("requests")
    .select(REQUEST_SELECT_WITH_ASSIGNEE)
    .neq("status", "closed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (teamId) {
    q = q.eq("team_id", teamId);
  }

  const { data, error } = await q;

  assertNoError("getRecentlyUpdatedRequests", error);
  return ((data ?? []) as RequestRowWithAssignee[]).map(requestRowToRequest);
}

/** Almeno una richiesta visibile (per empty state). */
export async function getRequestsTotalCount(scope: TeamQueryScope): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const teamId = teamIdForScope(scope);

  let q = supabase.from("requests").select("*", { count: "exact", head: true });

  if (teamId) {
    q = q.eq("team_id", teamId);
  }

  const { count, error } = await q;

  assertNoError("getRequestsTotalCount", error);
  return count ?? 0;
}
