import type { SupabaseClient } from "@supabase/supabase-js";
import { uniqueTagIds } from "@/lib/tags";

export type TagAssignmentTable =
  | "request_tag_assignments"
  | "task_tag_assignments"
  | "team_note_tag_assignments"
  | "inbox_tag_assignments";

export type TagAssignmentEntityColumn =
  | "request_id"
  | "task_id"
  | "note_id"
  | "inbox_item_id";

export type TagWriteResult = { ok: true } | { ok: false; message: string };

/**
 * Inserisce le assegnazioni tag per un'entità appena creata (nessuna delete).
 * RLS garantisce che tag ed entità appartengano allo stesso team.
 */
export async function insertTagAssignments(
  supabase: SupabaseClient,
  opts: {
    table: TagAssignmentTable;
    entityColumn: TagAssignmentEntityColumn;
    entityId: string;
    tagIds: string[];
    userId: string;
  },
): Promise<TagWriteResult> {
  const tagIds = uniqueTagIds(opts.tagIds);
  if (tagIds.length === 0) return { ok: true };

  const rows = tagIds.map((tag_id) => ({
    [opts.entityColumn]: opts.entityId,
    tag_id,
    applied_by_user_id: opts.userId,
  }));
  const { error } = await supabase.from(opts.table).insert(rows);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/** Sostituisce tutte le assegnazioni tag di un'entità (delete + insert). */
export async function replaceTagAssignments(
  supabase: SupabaseClient,
  opts: {
    table: TagAssignmentTable;
    entityColumn: TagAssignmentEntityColumn;
    entityId: string;
    tagIds: string[];
    userId: string;
  },
): Promise<TagWriteResult> {
  const { error: delError } = await supabase
    .from(opts.table)
    .delete()
    .eq(opts.entityColumn, opts.entityId);
  if (delError) return { ok: false, message: delError.message };
  return insertTagAssignments(supabase, opts);
}

/**
 * Inserisce le assegnazioni tag per più voci checklist di un progetto
 * (usato in creazione: la mappa arriva dal form, gli id sono generati client-side).
 */
export async function insertChecklistTagAssignments(
  supabase: SupabaseClient,
  opts: {
    requestId: string;
    tagIdsByTask: Record<string, string[]>;
    /** Se fornito, ignora voci checklist non presenti (evita assegnazioni orfane). */
    allowedTaskIds?: Set<string>;
    userId: string;
  },
): Promise<TagWriteResult> {
  const rows: {
    request_id: string;
    checklist_task_id: string;
    tag_id: string;
    applied_by_user_id: string;
  }[] = [];

  for (const [taskId, ids] of Object.entries(opts.tagIdsByTask)) {
    if (!taskId) continue;
    if (opts.allowedTaskIds && !opts.allowedTaskIds.has(taskId)) continue;
    for (const tag_id of uniqueTagIds(ids)) {
      rows.push({
        request_id: opts.requestId,
        checklist_task_id: taskId,
        tag_id,
        applied_by_user_id: opts.userId,
      });
    }
  }

  if (rows.length === 0) return { ok: true };
  const { error } = await supabase
    .from("checklist_tag_assignments")
    .insert(rows);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Rimuove le assegnazioni tag di voci checklist che non esistono più nel
 * `next_action` del progetto (pulizia orfani dopo un salvataggio).
 */
export async function pruneChecklistTagAssignments(
  supabase: SupabaseClient,
  requestId: string,
  keepTaskIds: string[],
): Promise<TagWriteResult> {
  let query = supabase
    .from("checklist_tag_assignments")
    .delete()
    .eq("request_id", requestId);

  const keep = uniqueTagIds(keepTaskIds);
  if (keep.length > 0) {
    const list = keep.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
    query = query.not("checklist_task_id", "in", `(${list})`);
  }

  const { error } = await query;
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
