"use server";

import {
  getActiveAssigneeOptions,
  getActiveAssigneeOptionsAllTeams,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import type { AssigneeOption } from "@/types/profile";

export type ListNoteSharingOptionsResult =
  | { ok: true; options: AssigneeOption[] }
  | { ok: false; message: string };

/** Utenti per condivisione note (admin: tutti i team). */
export async function listNoteSharingOptions(): Promise<ListNoteSharingOptionsResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false, message: "Sessione non valida." };
  }

  const options =
    me.role === "admin"
      ? await getActiveAssigneeOptionsAllTeams()
      : await getActiveAssigneeOptions(me.teamId);

  return {
    ok: true,
    options: options.filter((o) => o.userId !== me.userId),
  };
}
