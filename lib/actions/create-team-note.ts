"use server";

import { revalidatePath } from "next/cache";
import { parseNoteColor, titleFromBody } from "@/lib/team-note-access";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NoteVisibility } from "@/types/note";

export type CreateTeamNoteResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function parseVisibility(raw: string): NoteVisibility {
  if (raw === "team" || raw === "shared") return raw;
  return "private";
}

export async function createTeamNote(
  fd: FormData,
): Promise<CreateTeamNoteResult> {
  const titleRaw = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const visibility = parseVisibility(String(fd.get("visibility") ?? "private"));
  const sharedRaw = String(fd.get("sharedUserIds") ?? "[]");
  let sharedUserIds: string[] = [];
  try {
    const parsed = JSON.parse(sharedRaw) as unknown;
    if (Array.isArray(parsed)) {
      sharedUserIds = parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    sharedUserIds = [];
  }

  if (!body && !titleRaw) {
    return { ok: false, message: "Scrivi qualcosa nella nota." };
  }

  if (visibility === "shared" && sharedUserIds.length === 0) {
    return {
      ok: false,
      message: "Seleziona almeno un utente per la condivisione.",
    };
  }

  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false, message: "Sessione non valida." };
  }

  const title = titleFromBody(body, titleRaw);
  const colorRaw = String(fd.get("color") ?? "").trim();
  const color = colorRaw ? parseNoteColor(colorRaw) : null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_notes")
    .insert({
      team_id: me.teamId,
      created_by_user_id: me.userId,
      title,
      body,
      visibility,
      color,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const id = data?.id;
  if (!id || typeof id !== "string") {
    return {
      ok: false,
      message: "Nessun identificativo restituito dal database.",
    };
  }

  if (visibility === "shared" && sharedUserIds.length > 0) {
    const uniqueShared = [
      ...new Set(sharedUserIds.filter((user_id) => user_id !== me.userId)),
    ];
    if (uniqueShared.length > 0) {
      const { error: sharedError } = await supabase
        .from("team_note_shared_users")
        .insert(
          uniqueShared.map((user_id) => ({
            note_id: id,
            user_id,
          })),
        );
      if (sharedError) {
        return { ok: false, message: sharedError.message };
      }
    }
  }

  revalidatePath("/app/notes");
  return { ok: true, id };
}
