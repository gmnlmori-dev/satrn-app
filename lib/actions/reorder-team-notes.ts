"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReorderTeamNotesResult =
  | { ok: true }
  | { ok: false; message: string };

export async function reorderTeamNotes(
  orderedIds: string[],
  isPinned: boolean,
): Promise<ReorderTeamNotesResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }

  const uniqueIds = [...new Set(orderedIds)];
  if (uniqueIds.length === 0) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error: fetchError } = await supabase
    .from("team_notes")
    .select("id, created_by_user_id, is_pinned")
    .in("id", uniqueIds);

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if ((rows ?? []).length !== uniqueIds.length) {
    return { ok: false, message: "Una o più note non sono state trovate." };
  }

  for (const row of rows ?? []) {
    if (row.created_by_user_id !== me.userId) {
      return { ok: false, message: "Non puoi riordinare note altrui." };
    }
    if (row.is_pinned !== isPinned) {
      return {
        ok: false,
        message: "Le note pinnate e non pinnate vanno riordinate separatamente.",
      };
    }
  }

  for (let index = 0; index < uniqueIds.length; index += 1) {
    const id = uniqueIds[index];
    const { error } = await supabase
      .from("team_notes")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("created_by_user_id", me.userId);

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  revalidatePath("/app/notes");
  return { ok: true };
}
