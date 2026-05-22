"use server";

import { revalidatePath } from "next/cache";
import { getTeamNoteById } from "@/lib/supabase/note-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NoteVisibility } from "@/types/note";

export type UpdateTeamNoteSharingResult =
  | { ok: true }
  | { ok: false; message: string };

function parseVisibility(raw: string): NoteVisibility | null {
  if (raw === "private" || raw === "team" || raw === "shared") return raw;
  return null;
}

export async function updateTeamNoteSharing(
  noteId: string,
  visibility: NoteVisibility,
  sharedUserIds: string[],
): Promise<UpdateTeamNoteSharingResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }

  const parsed = parseVisibility(visibility);
  if (!parsed) {
    return { ok: false, message: "Visibilità non valida." };
  }

  const note = await getTeamNoteById(noteId);
  if (!note) {
    return { ok: false, message: "Nota non trovata." };
  }
  if (note.createdByUserId !== me.userId) {
    return { ok: false, message: "Solo il creatore può cambiare la condivisione." };
  }

  const uniqueShared = [
    ...new Set(sharedUserIds.filter((id) => id && id !== me.userId)),
  ];

  if (parsed === "shared" && uniqueShared.length === 0) {
    return {
      ok: false,
      message: "Seleziona almeno un utente per la condivisione.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("team_notes")
    .update({ visibility: parsed })
    .eq("id", noteId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const { error: deleteError } = await supabase
    .from("team_note_shared_users")
    .delete()
    .eq("note_id", noteId);

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  if (parsed === "shared" && uniqueShared.length > 0) {
    const { error: insertError } = await supabase
      .from("team_note_shared_users")
      .insert(
        uniqueShared.map((user_id) => ({
          note_id: noteId,
          user_id,
        })),
      );

    if (insertError) {
      return { ok: false, message: insertError.message };
    }
  }

  revalidatePath("/app/notes");
  return { ok: true };
}
