"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetTagsResult =
  | { ok: true }
  | { ok: false; message: string };

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

async function requireActiveUser() {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false as const, message: "Sessione non valida.", me: null };
  }
  return { ok: true as const, me };
}

async function replaceAssignments(opts: {
  table:
    | "request_tag_assignments"
    | "task_tag_assignments"
    | "team_note_tag_assignments";
  entityColumn: "request_id" | "task_id" | "note_id";
  entityId: string;
  tagIds: string[];
  userId: string;
  revalidate: string[];
}): Promise<SetTagsResult> {
  const supabase = await createSupabaseServerClient();
  const tagIds = uniqueIds(opts.tagIds);

  const { error: delError } = await supabase
    .from(opts.table)
    .delete()
    .eq(opts.entityColumn, opts.entityId);
  if (delError) return { ok: false, message: delError.message };

  if (tagIds.length > 0) {
    const rows = tagIds.map((tag_id) => ({
      [opts.entityColumn]: opts.entityId,
      tag_id,
      applied_by_user_id: opts.userId,
    }));
    const { error: insError } = await supabase.from(opts.table).insert(rows);
    if (insError) return { ok: false, message: insError.message };
  }

  for (const path of opts.revalidate) {
    revalidatePath(path);
  }
  return { ok: true };
}

export async function setRequestTags(
  requestId: string,
  tagIds: string[],
): Promise<SetTagsResult> {
  const gate = await requireActiveUser();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  return replaceAssignments({
    table: "request_tag_assignments",
    entityColumn: "request_id",
    entityId: requestId,
    tagIds,
    userId: gate.me.userId,
    revalidate: [
      "/app/requests",
      `/app/requests/${requestId}`,
      "/app/follow-up",
      "/app/calendar",
      "/app/dashboard",
    ],
  });
}

export async function setTaskTags(
  taskId: string,
  tagIds: string[],
): Promise<SetTagsResult> {
  const gate = await requireActiveUser();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  return replaceAssignments({
    table: "task_tag_assignments",
    entityColumn: "task_id",
    entityId: taskId,
    tagIds,
    userId: gate.me.userId,
    revalidate: ["/app/tasks", "/app/follow-up", "/app/calendar", "/app/dashboard"],
  });
}

export async function setNoteTags(
  noteId: string,
  tagIds: string[],
): Promise<SetTagsResult> {
  const gate = await requireActiveUser();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  return replaceAssignments({
    table: "team_note_tag_assignments",
    entityColumn: "note_id",
    entityId: noteId,
    tagIds,
    userId: gate.me.userId,
    revalidate: ["/app/notes"],
  });
}

export async function setChecklistItemTags(
  requestId: string,
  checklistTaskId: string,
  tagIds: string[],
): Promise<SetTagsResult> {
  const gate = await requireActiveUser();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  const supabase = await createSupabaseServerClient();
  const ids = uniqueIds(tagIds);

  const { error: delError } = await supabase
    .from("checklist_tag_assignments")
    .delete()
    .eq("request_id", requestId)
    .eq("checklist_task_id", checklistTaskId);
  if (delError) return { ok: false, message: delError.message };

  if (ids.length > 0) {
    const rows = ids.map((tag_id) => ({
      request_id: requestId,
      checklist_task_id: checklistTaskId,
      tag_id,
      applied_by_user_id: gate.me!.userId,
    }));
    const { error: insError } = await supabase
      .from("checklist_tag_assignments")
      .insert(rows);
    if (insError) return { ok: false, message: insError.message };
  }

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");
  return { ok: true };
}
