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

/** Opzioni assegnazione per creazione richiesta (admin/manager). */
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

  const resolvedTeamId =
    me.role === "admin" ? teamId.trim() || me.teamId : me.teamId;
  if (!resolvedTeamId) {
    return { ok: false, message: "Team non valido." };
  }
  if (me.role !== "admin" && resolvedTeamId !== me.teamId) {
    return { ok: false, message: "Team non consentito." };
  }

  const options = await getActiveAssigneeOptions(resolvedTeamId);
  return { ok: true, options };
}
