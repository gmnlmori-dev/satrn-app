import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";
import type { AssigneeOption, ProfileSummary } from "@/types/profile";

function assertNoError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function profileRowToSummary(row: ProfileRow): ProfileSummary {
  return {
    userId: row.user_id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    role: row.role,
    isActive: row.is_active,
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
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentProfileSummary]", error.message);
    return null;
  }
  if (!data) return null;

  const row = data as ProfileRow;
  return profileRowToSummary(row);
}

/** Utenti attivi per picker assegnazione (ordine alfabetico). */
export async function getActiveAssigneeOptions(): Promise<AssigneeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .eq("is_active", true)
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

/** Elenco totale utenti/profilo per pagina admin. */
export async function getProfilesForAdminList(): Promise<ProfileSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  assertNoError("getProfilesForAdminList", error);
  return ((data ?? []) as ProfileRow[]).map(profileRowToSummary);
}
