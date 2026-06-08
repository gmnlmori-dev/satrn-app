import { teamNoteRowToNote } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeamNoteRowWithRelations } from "@/types/database";
import type { TeamNote } from "@/types/note";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

export const TEAM_NOTE_SELECT = `
  *,
  creator:profiles!team_notes_created_by_user_id_fkey (
    user_id,
    full_name,
    email
  ),
  team_note_shared_users (
    user_id
  ),
  team_note_shared_teams (
    team_id
  )
`;

/** Elenco note team visibili all'utente corrente (RLS), più recenti per prime. */
export async function getTeamNotes(): Promise<TeamNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_notes")
    .select(TEAM_NOTE_SELECT)
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  assertNoError("getTeamNotes", error);
  return ((data ?? []) as TeamNoteRowWithRelations[]).map(teamNoteRowToNote);
}

/** Dettaglio nota per id, o `null` se assente o non visibile. */
export async function getTeamNoteById(id: string): Promise<TeamNote | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_notes")
    .select(TEAM_NOTE_SELECT)
    .eq("id", id)
    .maybeSingle();

  assertNoError("getTeamNoteById", error);
  if (!data) return null;
  return teamNoteRowToNote(data as TeamNoteRowWithRelations);
}
