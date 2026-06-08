import type { AppRole } from "@/types/profile";

export type AssigneeProfileRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  team_id: string;
};

export function validateAssigneeProfiles(
  rows: AssigneeProfileRow[],
  expectedUserIds: string[],
  entityTeamId: string,
  actorRole: AppRole,
): { ok: true } | { ok: false; message: string } {
  if (rows.length !== expectedUserIds.length) {
    return { ok: false, message: "Uno o più destinatari non sono validi." };
  }

  for (const row of rows) {
    if (!row.is_active) {
      return { ok: false, message: "Uno o più utenti selezionati non sono attivi." };
    }
    if (actorRole !== "admin" && row.team_id !== entityTeamId) {
      return {
        ok: false,
        message: "Uno o più utenti non appartengono al team dell'elemento.",
      };
    }
  }

  return { ok: true };
}
