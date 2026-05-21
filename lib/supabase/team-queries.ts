import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TeamRow } from "@/types/database";
import type { TeamSelectOption, TeamSummary } from "@/types/team";

function assertNoError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function teamRowToSummary(row: TeamRow): TeamSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTeamsForAdminList(): Promise<TeamSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });

  assertNoError("getTeamsForAdminList", error);
  return ((data ?? []) as TeamRow[]).map(teamRowToSummary);
}

export async function getTeamsForSelect(): Promise<TeamSelectOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  assertNoError("getTeamsForSelect", error);
  return ((data ?? []) as Pick<TeamRow, "id" | "name" | "slug">[]).map(
    (row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    }),
  );
}

export async function getTeamById(id: string): Promise<TeamSummary | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getTeamById]", error.message);
    return null;
  }
  if (!data) return null;
  return teamRowToSummary(data as TeamRow);
}
