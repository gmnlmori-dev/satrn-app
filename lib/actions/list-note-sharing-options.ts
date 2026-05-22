"use server";

import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import type { AssigneeOption } from "@/types/profile";

export type ListNoteSharingOptionsResult =
  | { ok: true; options: AssigneeOption[] }
  | { ok: false; message: string };

/** Utenti attivi del team per checklist condivisione note. */
export async function listNoteSharingOptions(): Promise<ListNoteSharingOptionsResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false, message: "Sessione non valida." };
  }

  const options = await getActiveAssigneeOptions(me.teamId);
  return {
    ok: true,
    options: options.filter((o) => o.userId !== me.userId),
  };
}
