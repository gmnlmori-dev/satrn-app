"use server";

import { revalidatePath } from "next/cache";
import { parseNoteColor, titleFromBody } from "@/lib/team-note-access";
import { getTeamNoteById } from "@/lib/supabase/note-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NoteColor } from "@/types/note";

export type UpdateTeamNotePatch = {
  title?: string;
  body?: string;
  color?: NoteColor | null;
  isPinned?: boolean;
  sortOrder?: number;
};

export type UpdateTeamNoteResult =
  | { ok: true; updatedAt: string; sortOrder: number }
  | { ok: false; message: string };

export async function updateTeamNote(
  id: string,
  patch: UpdateTeamNotePatch,
): Promise<UpdateTeamNoteResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }

  const note = await getTeamNoteById(id);
  if (!note) {
    return { ok: false, message: "Nota non trovata." };
  }
  if (note.createdByUserId !== me.userId) {
    return { ok: false, message: "Non puoi modificare questa nota." };
  }

  const nextTitle =
    patch.title !== undefined || patch.body !== undefined
      ? titleFromBody(
          patch.body !== undefined ? patch.body : note.body,
          patch.title !== undefined ? patch.title : note.title,
        )
      : undefined;

  const update: Record<string, unknown> = {};
  if (nextTitle !== undefined) update.title = nextTitle;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.color !== undefined) {
    update.color = patch.color ? parseNoteColor(patch.color) : null;
  }
  if (patch.isPinned !== undefined) update.is_pinned = patch.isPinned;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  if (Object.keys(update).length === 0) {
    return { ok: true, updatedAt: note.updatedAt, sortOrder: note.sortOrder };
  }

  const supabase = await createSupabaseServerClient();

  if (
    patch.isPinned !== undefined &&
    patch.isPinned !== note.isPinned &&
    patch.sortOrder === undefined
  ) {
    const { data: minSortRow } = await supabase
      .from("team_notes")
      .select("sort_order")
      .eq("created_by_user_id", me.userId)
      .eq("is_pinned", patch.isPinned)
      .eq("is_archived", note.isArchived)
      .neq("id", id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    update.sort_order = (minSortRow?.sort_order ?? 0) - 1;
  }

  const { data, error } = await supabase
    .from("team_notes")
    .update(update)
    .eq("id", id)
    .select("updated_at, sort_order")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Aggiornamento non riuscito.",
    };
  }

  revalidatePath("/app/notes");
  return {
    ok: true,
    updatedAt: (data as { updated_at: string }).updated_at,
    sortOrder: (data as { sort_order: number }).sort_order,
  };
}
