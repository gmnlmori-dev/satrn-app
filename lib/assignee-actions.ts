import { validateAssigneeProfiles } from "@/lib/assignee-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/profile";

export type AssigneeProfile = {
  full_name: string | null;
  email: string | null;
};

export function assigneeCaption(p: AssigneeProfile | null): string {
  if (!p) return "Utente sconosciuto";
  const n = (p.full_name ?? "").trim();
  const e = (p.email ?? "").trim();
  if (n && e) return `${n} (${e})`;
  return n || e || "Utente sconosciuto";
}

export function nestedAssigneeProfile(
  value: AssigneeProfile | AssigneeProfile[] | null | undefined,
): AssigneeProfile | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function normalizeAssigneeIds(raw: string[]): string[] {
  return [...new Set(raw.map((id) => id.trim()).filter(Boolean))].sort();
}

export function sameAssigneeSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

export async function loadAssigneeProfiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userIds: string[],
  entityTeamId: string,
  actorRole: AppRole,
): Promise<
  | { ok: true; profiles: Map<string, AssigneeProfile> }
  | { ok: false; message: string }
> {
  if (userIds.length === 0) {
    return { ok: true, profiles: new Map() };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, is_active, team_id")
    .in("user_id", userIds);

  if (error) return { ok: false, message: error.message };

  const rows = (data ?? []) as {
    user_id: string;
    full_name: string | null;
    email: string | null;
    is_active: boolean;
    team_id: string;
  }[];

  if (rows.length !== userIds.length) {
    return { ok: false, message: "Uno o più destinatari non sono validi." };
  }

  const check = validateAssigneeProfiles(rows, userIds, entityTeamId, actorRole);
  if (!check.ok) return check;

  const profiles = new Map<string, AssigneeProfile>();
  for (const row of rows) {
    profiles.set(row.user_id, {
      full_name: row.full_name,
      email: row.email,
    });
  }

  return { ok: true, profiles };
}

type SharedUserProfileRow = {
  user_id: string;
  team_id: string;
  is_active: boolean;
};

/** Valida utenti condivisi per note (stesso criterio di update-team-note-sharing). */
export function validateSharedNoteUsers(
  rows: SharedUserProfileRow[],
  expectedUserIds: string[],
  noteTeamId: string,
  actorRole: AppRole,
): { ok: true } | { ok: false; message: string } {
  if (rows.length !== expectedUserIds.length) {
    return { ok: false, message: "Uno o più utenti condivisi non sono validi." };
  }

  for (const row of rows) {
    if (!row.is_active) {
      return { ok: false, message: "Uno o più utenti selezionati non sono attivi." };
    }
    if (actorRole !== "admin" && row.team_id !== noteTeamId) {
      return {
        ok: false,
        message: "Puoi condividere solo con utenti del tuo team.",
      };
    }
  }

  return { ok: true };
}
