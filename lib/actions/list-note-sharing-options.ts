"use server";

import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import type { AssigneeOption } from "@/types/profile";

export type ListNoteSharingOptionsResult =
  | { ok: true; options: AssigneeOption[] }
  | { ok: false; message: string };

/** Utenti per condivisione nota nel team indicato (admin: team scelto in UI). */
export async function listNoteSharingOptions(
  teamId: string,
): Promise<ListNoteSharingOptionsResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false, message: "Sessione non valida." };
  }

  const resolvedTeamId = teamId.trim() || me.teamId;
  if (!resolvedTeamId) {
    return { ok: false, message: "Seleziona un team." };
  }

  const options = await getActiveAssigneeOptions(resolvedTeamId);

  return {
    ok: true,
    options: options.filter((o) => o.userId !== me.userId),
  };
}
