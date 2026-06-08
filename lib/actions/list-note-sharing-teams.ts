"use server";

import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NoteSharingTeamOption = {
  id: string;
  name: string;
};

export type ListNoteSharingTeamsResult =
  | { ok: true; teams: NoteSharingTeamOption[] }
  | { ok: false; message: string };

/** Team disponibili per condivisione nota (solo admin). */
export async function listNoteSharingTeams(
  excludeTeamId?: string,
): Promise<ListNoteSharingTeamsResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }
  if (me.role !== "admin") {
    return { ok: true, teams: [] };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    return { ok: false, message: error.message };
  }

  const teams = ((data ?? []) as { id: string; name: string }[])
    .filter((t) => t.id !== (excludeTeamId?.trim() || ""))
    .map((t) => ({ id: t.id, name: t.name.trim() || "Team" }));

  return { ok: true, teams };
}
