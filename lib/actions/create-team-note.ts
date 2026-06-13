"use server";

import { revalidatePath } from "next/cache";
import { parseNoteColor, titleFromBody } from "@/lib/team-note-access";
import { validateSharedNoteUsers } from "@/lib/assignee-actions";
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
  const sharedTeamsRaw = String(fd.get("sharedTeamIds") ?? "[]");
  let sharedUserIds: string[] = [];
  let sharedTeamIds: string[] = [];
  try {
    const parsed = JSON.parse(sharedRaw) as unknown;
    if (Array.isArray(parsed)) {
      sharedUserIds = parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    sharedUserIds = [];
  }
  try {
    const parsed = JSON.parse(sharedTeamsRaw) as unknown;
    if (Array.isArray(parsed)) {
      sharedTeamIds = parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    sharedTeamIds = [];
  }

  if (!body && !titleRaw) {
    return { ok: false, message: "Scrivi qualcosa nella nota." };
  }

  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false, message: "Sessione non valida." };
  }

  const uniqueShared = [
    ...new Set(sharedUserIds.filter((id) => id && id !== me.userId)),
  ];
  const uniqueTeams = [...new Set(sharedTeamIds.filter(Boolean))];

  if (
    visibility === "shared" &&
    uniqueShared.length === 0 &&
    uniqueTeams.length === 0
  ) {
    return {
      ok: false,
      message: "Seleziona almeno un utente o un team per la condivisione.",
    };
  }

  if (uniqueTeams.length > 0 && me.role !== "admin") {
    return {
      ok: false,
      message: "Solo gli admin possono condividere con altri team.",
    };
  }

  if (uniqueTeams.includes(me.teamId)) {
    return {
      ok: false,
      message: "Usa la visibilità Team per il team proprietario della nota.",
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
      me.teamId,
      me.role,
    );
    if (!check.ok) return check;
  }

  const title = titleFromBody(body, titleRaw);
  const colorRaw = String(fd.get("color") ?? "").trim();
  const color = colorRaw ? parseNoteColor(colorRaw) : null;

  const { data: minSortRow } = await supabase
    .from("team_notes")
    .select("sort_order")
    .eq("created_by_user_id", me.userId)
    .eq("is_pinned", false)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const sortOrder = (minSortRow?.sort_order ?? 0) - 1;

  const { data, error } = await supabase
    .from("team_notes")
    .insert({
      team_id: me.teamId,
      created_by_user_id: me.userId,
      title,
      body,
      visibility,
      color,
      sort_order: sortOrder,
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

  if (visibility === "shared" && uniqueShared.length > 0) {
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

  if (visibility === "shared" && uniqueTeams.length > 0) {
    const { error: teamsError } = await supabase
      .from("team_note_shared_teams")
      .insert(
        uniqueTeams.map((team_id) => ({
          note_id: id,
          team_id,
        })),
      );
    if (teamsError) {
      return { ok: false, message: teamsError.message };
    }
  }

  revalidatePath("/app/notes");
  return { ok: true, id };
}
