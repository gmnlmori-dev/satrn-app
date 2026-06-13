import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import {
  countOpenTasksByWindow,
  countRequestsInFollowUpWindow,
  type OpenTaskWindowCounts,
} from "@/lib/next-action-tasks";
import { countTasksByWindow } from "@/lib/task-windows";
import type { Task } from "@/types/task";
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

async function fetchOpenRequestsForDashboard(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  scope: TeamQueryScope,
  assignedUserId?: string,
): Promise<Request[]> {
  const teamId = teamIdForScope(scope);

  const select = assignedUserId
    ? `
      *,
      request_assignees!inner (
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
      team:teams!requests_team_id_fkey ( name ),
      creator:profiles!requests_created_by_user_id_fkey (
        user_id,
        full_name,
        email
      )
    `
    : REQUEST_SELECT_WITH_ASSIGNEE;

  let q = supabase.from("requests").select(select).neq("status", "closed");

  if (teamId) {
    q = q.eq("team_id", teamId);
  }

  if (assignedUserId) {
    q = q.eq("request_assignees.user_id", assignedUserId);
  }

  const { data, error } = await q;
  assertNoError("dashboard open requests", error);
  return ((data ?? []) as RequestRowWithAssignee[]).map(requestRowToRequest);
}

/** Conteggi allineati alla vista «Da seguire» (scadenza effettiva), scoped per team. */
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

  const [requests, inbox] = await Promise.all([
    fetchOpenRequestsForDashboard(supabase, scope),
    inboxQuery,
  ]);

  assertNoError("dashboard inbox count", inbox.error);

  return {
    overdue: countRequestsInFollowUpWindow(requests, "overdue", bounds),
    today: countRequestsInFollowUpWindow(requests, "today", bounds),
    upcomingWeek: countRequestsInFollowUpWindow(requests, "upcoming", bounds),
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
  const requests = await fetchOpenRequestsForDashboard(supabase, scope, userId);

  return {
    overdue: countRequestsInFollowUpWindow(requests, "overdue", bounds),
    today: countRequestsInFollowUpWindow(requests, "today", bounds),
    upcomingWeek: countRequestsInFollowUpWindow(requests, "upcoming", bounds),
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

export type { OpenTaskWindowCounts as DashboardStandaloneTaskCounts };

async function fetchOpenTasksForDashboard(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  scope: TeamQueryScope,
  assignedUserId?: string,
): Promise<Pick<Task, "done" | "dueAt">[]> {
  const teamId = teamIdForScope(scope);

  let q = assignedUserId
    ? supabase
        .from("tasks")
        .select("done, due_at, task_assignees!inner(user_id)")
        .eq("done", false)
        .eq("task_assignees.user_id", assignedUserId)
    : supabase.from("tasks").select("done, due_at").eq("done", false);

  if (teamId) {
    q = q.eq("team_id", teamId);
  }

  const { data, error } = await q;
  assertNoError("dashboard standalone task counts", error);

  return ((data ?? []) as { done: boolean; due_at: string | null }[]).map(
    (row) => ({
      done: row.done,
      dueAt: row.due_at,
    }),
  );
}

/** Task libere aperte assegnate all'utente. */
export async function getDashboardStandaloneTaskCounts(
  userId: string,
  scope: TeamQueryScope,
): Promise<OpenTaskWindowCounts | null> {
  if (!userId) return null;
  const supabase = await createSupabaseServerClient();
  const tasks = await fetchOpenTasksForDashboard(supabase, scope, userId);
  return countTasksByWindow(tasks, getFollowUpWindowBounds());
}

/** Task libere aperte del team (panoramica coda). */
export async function getDashboardTeamStandaloneTaskCounts(
  scope: TeamQueryScope,
): Promise<OpenTaskWindowCounts> {
  const supabase = await createSupabaseServerClient();
  const tasks = await fetchOpenTasksForDashboard(supabase, scope);
  return countTasksByWindow(tasks, getFollowUpWindowBounds());
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
