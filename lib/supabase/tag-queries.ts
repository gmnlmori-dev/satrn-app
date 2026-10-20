import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { teamTagRowToTeamTag } from "@/lib/tags";
import type { TeamTag, TeamTagRow } from "@/types/tag";
import type { Request } from "@/types/request";
import type { Task } from "@/types/task";
import type { TeamNote } from "@/types/note";
import type { InboxItem } from "@/types/inbox";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

function groupIdsByKey(
  rows: { key: string; tag_id: string }[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.key) ?? [];
    list.push(row.tag_id);
    map.set(row.key, list);
  }
  return map;
}

/** Tag del team (o tutti i team visibili all'admin via RLS). */
export const getTeamTags = cache(
  async (teamId?: string): Promise<TeamTag[]> => {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("team_tags")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;
    assertNoError("getTeamTags", error);
    return ((data ?? []) as TeamTagRow[]).map(teamTagRowToTeamTag);
  },
);

export async function attachRequestTagIds(
  requests: Request[],
): Promise<Request[]> {
  if (requests.length === 0) return requests;
  const supabase = await createSupabaseServerClient();
  const ids = requests.map((r) => r.id);
  const { data, error } = await supabase
    .from("request_tag_assignments")
    .select("request_id, tag_id")
    .in("request_id", ids);
  assertNoError("attachRequestTagIds", error);
  const grouped = groupIdsByKey(
    ((data ?? []) as { request_id: string; tag_id: string }[]).map((r) => ({
      key: r.request_id,
      tag_id: r.tag_id,
    })),
  );
  return requests.map((r) => ({
    ...r,
    tagIds: grouped.get(r.id) ?? [],
  }));
}

export async function attachTaskTagIds(tasks: Task[]): Promise<Task[]> {
  if (tasks.length === 0) return tasks;
  const supabase = await createSupabaseServerClient();
  const ids = tasks.map((t) => t.id);
  const { data, error } = await supabase
    .from("task_tag_assignments")
    .select("task_id, tag_id")
    .in("task_id", ids);
  assertNoError("attachTaskTagIds", error);
  const grouped = groupIdsByKey(
    ((data ?? []) as { task_id: string; tag_id: string }[]).map((r) => ({
      key: r.task_id,
      tag_id: r.tag_id,
    })),
  );
  return tasks.map((t) => ({
    ...t,
    tagIds: grouped.get(t.id) ?? [],
  }));
}

export async function attachNoteTagIds(notes: TeamNote[]): Promise<TeamNote[]> {
  if (notes.length === 0) return notes;
  const supabase = await createSupabaseServerClient();
  const ids = notes.map((n) => n.id);
  const { data, error } = await supabase
    .from("team_note_tag_assignments")
    .select("note_id, tag_id")
    .in("note_id", ids);
  assertNoError("attachNoteTagIds", error);
  const grouped = groupIdsByKey(
    ((data ?? []) as { note_id: string; tag_id: string }[]).map((r) => ({
      key: r.note_id,
      tag_id: r.tag_id,
    })),
  );
  return notes.map((n) => ({
    ...n,
    tagIds: grouped.get(n.id) ?? [],
  }));
}

export async function attachInboxTagIds(
  items: InboxItem[],
): Promise<InboxItem[]> {
  if (items.length === 0) return items;
  const supabase = await createSupabaseServerClient();
  const ids = items.map((i) => i.id);
  const { data, error } = await supabase
    .from("inbox_tag_assignments")
    .select("inbox_item_id, tag_id")
    .in("inbox_item_id", ids);
  assertNoError("attachInboxTagIds", error);
  const grouped = groupIdsByKey(
    ((data ?? []) as { inbox_item_id: string; tag_id: string }[]).map(
      (r) => ({ key: r.inbox_item_id, tag_id: r.tag_id }),
    ),
  );
  return items.map((i) => ({
    ...i,
    tagIds: grouped.get(i.id) ?? [],
  }));
}

/** Mappa checklist_task_id → tagIds per un progetto. */
export async function getChecklistTagIdsByRequest(
  requestId: string,
): Promise<Record<string, string[]>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("checklist_tag_assignments")
    .select("checklist_task_id, tag_id")
    .eq("request_id", requestId);
  assertNoError("getChecklistTagIdsByRequest", error);
  const out: Record<string, string[]> = {};
  for (const row of (data ?? []) as {
    checklist_task_id: string;
    tag_id: string;
  }[]) {
    const list = out[row.checklist_task_id] ?? [];
    list.push(row.tag_id);
    out[row.checklist_task_id] = list;
  }
  return out;
}

/** Bulk: requestId → (checklistTaskId → tagIds) per più progetti. */
export async function getChecklistTagIdsForRequests(
  requestIds: string[],
): Promise<Record<string, Record<string, string[]>>> {
  if (requestIds.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("checklist_tag_assignments")
    .select("request_id, checklist_task_id, tag_id")
    .in("request_id", requestIds);
  assertNoError("getChecklistTagIdsForRequests", error);
  const out: Record<string, Record<string, string[]>> = {};
  for (const row of (data ?? []) as {
    request_id: string;
    checklist_task_id: string;
    tag_id: string;
  }[]) {
    const byItem = out[row.request_id] ?? {};
    const list = byItem[row.checklist_task_id] ?? [];
    list.push(row.tag_id);
    byItem[row.checklist_task_id] = list;
    out[row.request_id] = byItem;
  }
  return out;
}
