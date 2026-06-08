"use server";

import { canAssignRequests } from "@/lib/permissions";
import {
  getActiveAssigneeOptions,
  getActiveAssigneeOptionsAllTeams,
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

  if (me.role === "admin") {
    const options = await getActiveAssigneeOptionsAllTeams();
    return { ok: true, options };
  }

  const resolvedTeamId = me.teamId;
  if (!resolvedTeamId) {
    return { ok: false, message: "Team non valido." };
  }

  const options = await getActiveAssigneeOptions(resolvedTeamId);
  return { ok: true, options };
}
