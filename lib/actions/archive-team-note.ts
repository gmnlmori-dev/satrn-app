"use server";

import { revalidatePath } from "next/cache";
import { getTeamNoteById } from "@/lib/supabase/note-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ArchiveTeamNoteResult =
  | { ok: true }
  | { ok: false; message: string };

export async function archiveTeamNote(
  noteId: string,
): Promise<ArchiveTeamNoteResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }

  const note = await getTeamNoteById(noteId);
  if (!note) {
    return { ok: false, message: "Nota non trovata." };
  }
  if (note.createdByUserId !== me.userId) {
    return { ok: false, message: "Solo il creatore può archiviare la nota." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("team_notes")
    .update({ is_archived: true, is_pinned: false })
    .eq("id", noteId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/app/notes");
  return { ok: true };
}
