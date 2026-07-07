"use server";

import { canAssignRequests } from "@/lib/permissions";
import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import type { AssigneeOption } from "@/types/profile";

export type ListAssigneeOptionsForCreateResult =
  | { ok: true; options: AssigneeOption[] }
  | { ok: false; message: string };

/** Opzioni assegnazione per creazione progetto (admin/manager). */
export async function listAssigneeOptionsForCreate(
  teamId: string,
): Promise<ListAssigneeOptionsForCreateResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }
  if (!canAssignRequests(me.role)) {
    return { ok: true, options: [] };
  }

  const resolvedTeamId = teamId.trim() || me.teamId;
  if (!resolvedTeamId) {
    return { ok: false, message: "Seleziona un team." };
  }

  const options = await getActiveAssigneeOptions(resolvedTeamId);
  return { ok: true, options };
}
