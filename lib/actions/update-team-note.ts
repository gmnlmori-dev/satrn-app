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
};

export type UpdateTeamNoteResult =
  | { ok: true; updatedAt: string }
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

  if (Object.keys(update).length === 0) {
    return { ok: true, updatedAt: note.updatedAt };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_notes")
    .update(update)
    .eq("id", id)
    .select("updated_at")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Aggiornamento non riuscito.",
    };
  }

  revalidatePath("/app/notes");
  return { ok: true, updatedAt: (data as { updated_at: string }).updated_at };
}
