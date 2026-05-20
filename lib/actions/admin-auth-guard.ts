"use server";

import { canManageUsers } from "@/lib/permissions";
import type { ProfileSummary } from "@/types/profile";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";

export type AdminActorResult =
  | { ok: true; actor: ProfileSummary }
  | { ok: false; message: string };

export async function assertAdminActor(): Promise<AdminActorResult> {
  const actor = await getCurrentProfileSummary();
  if (!actor?.userId || !actor.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }
  if (!canManageUsers(actor.role)) {
    return { ok: false, message: "Solo l’admin può gestire utenti e ruoli." };
  }
  return { ok: true, actor };
}
