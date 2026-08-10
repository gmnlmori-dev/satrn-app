import { getFollowUpWindowBounds } from "@/lib/follow-up-windows";
import { taskRowToTask } from "@/lib/supabase/task-mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TaskRowWithAssignee } from "@/types/database";
import type { Task } from "@/types/task";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

export const TASK_SELECT_WITH_ASSIGNEE = `
  *,
  task_assignees (
    user_id,
    assigned_at,
    assigned_by_user_id,
    assignee:profiles!task_assignees_user_id_fkey (
      user_id,
      full_name,
      email
    )
  ),
  creator:profiles!tasks_created_by_user_id_fkey (
    user_id,
    full_name,
    email
  ),
  team:teams!tasks_team_id_fkey (
    id,
    name
  )
`;

export async function getTasks(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_ASSIGNEE)
    .order("updated_at", { ascending: false });

  assertNoError("getTasks", error);
  return ((data ?? []) as TaskRowWithAssignee[]).map(taskRowToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_ASSIGNEE)
    .eq("id", id)
    .maybeSingle();

  assertNoError("getTaskById", error);
  if (!data) return null;
  return taskRowToTask(data as TaskRowWithAssignee);
}

export async function getOverdueStandaloneTasks(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  const { startTodayIso } = getFollowUpWindowBounds();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_ASSIGNEE)
    .eq("done", false)
    .not("due_at", "is", null)
    .lt("due_at", startTodayIso)
    .order("due_at", { ascending: true });

  assertNoError("getOverdueStandaloneTasks", error);
  return ((data ?? []) as TaskRowWithAssignee[]).map(taskRowToTask);
}

export async function getStandaloneTasksToday(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  const { startTodayIso, startTomorrowIso } = getFollowUpWindowBounds();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_ASSIGNEE)
    .eq("done", false)
    .not("due_at", "is", null)
    .gte("due_at", startTodayIso)
    .lt("due_at", startTomorrowIso)
    .order("due_at", { ascending: true });

  assertNoError("getStandaloneTasksToday", error);
  return ((data ?? []) as TaskRowWithAssignee[]).map(taskRowToTask);
}

export async function getUpcomingStandaloneTasks(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  const { startTomorrowIso, endWeekIso } = getFollowUpWindowBounds();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_ASSIGNEE)
    .eq("done", false)
    .not("due_at", "is", null)
    .gte("due_at", startTomorrowIso)
    .lte("due_at", endWeekIso)
    .order("due_at", { ascending: true });

  assertNoError("getUpcomingStandaloneTasks", error);
  return ((data ?? []) as TaskRowWithAssignee[]).map(taskRowToTask);
}

/** Tutte le task libere aperte (con o senza scadenza), ordinate: scadenza ASC, null in fondo. */
export async function getOpenStandaloneTasks(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_ASSIGNEE)
    .eq("done", false);

  assertNoError("getOpenStandaloneTasks", error);
  const tasks = ((data ?? []) as TaskRowWithAssignee[]).map(taskRowToTask);
  return tasks.sort((a, b) => {
    const aMs = a.dueAt ? new Date(a.dueAt).getTime() : null;
    const bMs = b.dueAt ? new Date(b.dueAt).getTime() : null;
    const aValid = aMs !== null && !Number.isNaN(aMs) ? aMs : null;
    const bValid = bMs !== null && !Number.isNaN(bMs) ? bMs : null;
    if (aValid === null && bValid === null) {
      return a.title.localeCompare(b.title, "it");
    }
    if (aValid === null) return 1;
    if (bValid === null) return -1;
    if (aValid !== bValid) return aValid - bValid;
    return a.title.localeCompare(b.title, "it");
  });
}
