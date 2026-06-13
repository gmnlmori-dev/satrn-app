"use server";

import { revalidatePath } from "next/cache";
import { validateSharedNoteUsers } from "@/lib/assignee-actions";
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
  sharedTeamIds: string[] = [],
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
  const uniqueTeams = [...new Set(sharedTeamIds.filter(Boolean))];

  if (parsed === "shared" && uniqueShared.length === 0 && uniqueTeams.length === 0) {
    return {
      ok: false,
      message: "Seleziona almeno un utente o un team per la condivisione.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (uniqueShared.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, team_id, is_active")
      .in("user_id", uniqueShared);

    if (profileErr) return { ok: false, message: profileErr.message };

    const check = validateSharedNoteUsers(
      (profiles ?? []) as { user_id: string; team_id: string; is_active: boolean }[],
      uniqueShared,
      note.teamId,
      me.role,
    );
    if (!check.ok) return check;
  }

  if (uniqueTeams.length > 0) {
    if (me.role !== "admin") {
      return {
        ok: false,
        message: "Solo gli admin possono condividere con altri team.",
      };
    }
    if (uniqueTeams.includes(note.teamId)) {
      return {
        ok: false,
        message: "Usa la visibilità Team per il team proprietario della nota.",
      };
    }
  }

  const { error: updateError } = await supabase
    .from("team_notes")
    .update({ visibility: parsed })
    .eq("id", noteId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const { error: deleteUsersError } = await supabase
    .from("team_note_shared_users")
    .delete()
    .eq("note_id", noteId);

  if (deleteUsersError) {
    return { ok: false, message: deleteUsersError.message };
  }

  const { error: deleteTeamsError } = await supabase
    .from("team_note_shared_teams")
    .delete()
    .eq("note_id", noteId);

  if (deleteTeamsError) {
    return { ok: false, message: deleteTeamsError.message };
  }

  if (parsed === "shared" && uniqueShared.length > 0) {
    const { error: insertUsersError } = await supabase
      .from("team_note_shared_users")
      .insert(
        uniqueShared.map((user_id) => ({
          note_id: noteId,
          user_id,
        })),
      );

    if (insertUsersError) {
      return { ok: false, message: insertUsersError.message };
    }
  }

  if (parsed === "shared" && uniqueTeams.length > 0) {
    const { error: insertTeamsError } = await supabase
      .from("team_note_shared_teams")
      .insert(
        uniqueTeams.map((team_id) => ({
          note_id: noteId,
          team_id,
        })),
      );

    if (insertTeamsError) {
      return { ok: false, message: insertTeamsError.message };
    }
  }

  revalidatePath("/app/notes");
  return { ok: true };
}
