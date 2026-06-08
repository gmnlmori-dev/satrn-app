import { parseUserPreferences } from "@/lib/user-preferences";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow, ProfileRowWithTeam } from "@/types/database";
import type { AssigneeOption, ProfileSummary } from "@/types/profile";

function assertNoError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function profileRowToSummary(row: ProfileRowWithTeam): ProfileSummary {
  return {
    userId: row.user_id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    role: row.role,
    isActive: row.is_active,
    teamId: row.team_id,
    teamName: row.team?.name ?? undefined,
    preferences: parseUserPreferences(row.preferences ?? {}),
  };
}

/** Profilo dell’utente loggato, o null se anonimo / profilo assente. */
export async function getCurrentProfileSummary(): Promise<ProfileSummary | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*, team:teams(id, name, slug)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentProfileSummary]", error.message);
    return null;
  }
  if (!data) return null;

  return profileRowToSummary(data as ProfileRowWithTeam);
}

/** Utenti attivi del team per picker assegnazione (ordine alfabetico). */
export async function getActiveAssigneeOptions(
  teamId: string,
): Promise<AssigneeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .eq("is_active", true)
    .eq("team_id", teamId)
    .order("full_name", { ascending: true });

  assertNoError("getActiveAssigneeOptions", error);
  const rows =
    ((data ?? []) as { user_id: string; full_name: string; email: string }[]) ??
    [];
  return rows.map((r) => ({
    userId: r.user_id,
    label:
      ((r.full_name ?? "").trim() ||
        (r.email ?? "").trim() ||
        r.user_id.slice(0, 8)) + "",
  }));
}

/** Utenti attivi di tutti i team (solo admin in UI/actions). */
export async function getActiveAssigneeOptionsAllTeams(): Promise<AssigneeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, team:teams(name)")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  assertNoError("getActiveAssigneeOptionsAllTeams", error);

  return (
    (data ?? []) as {
      user_id: string;
      full_name: string | null;
      email: string | null;
      team: { name: string } | { name: string }[] | null;
    }[]
  ).map((r) => {
    const name =
      (r.full_name ?? "").trim() ||
      (r.email ?? "").trim() ||
      r.user_id.slice(0, 8);
    const teamRaw = r.team;
    const teamName = Array.isArray(teamRaw)
      ? teamRaw[0]?.name
      : teamRaw?.name;
    const label = teamName ? `${name} · ${teamName}` : name;
    return { userId: r.user_id, label };
  });
}

/** Elenco totale utenti/profilo per pagina admin. */
export async function getProfilesForAdminList(): Promise<ProfileSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, team:teams(id, name, slug)")
    .order("created_at", { ascending: false });

  assertNoError("getProfilesForAdminList", error);
  return ((data ?? []) as ProfileRowWithTeam[]).map(profileRowToSummary);
}
