"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import {
  mapAdminAuthError,
  validatePassword,
} from "@/lib/actions/admin-auth-errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminSetUserPasswordResult =
  | { ok: true }
  | { ok: false; message: string };

export async function adminSetUserPassword(params: {
  userId: string;
  password: string;
}): Promise<AdminSetUserPasswordResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const userId = params.userId?.trim();
  if (!userId) {
    return { ok: false, message: "Utente non valido." };
  }

  const pwErr = validatePassword(params.password);
  if (pwErr) return { ok: false, message: pwErr };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: params.password,
  });

  if (error) {
    return { ok: false, message: mapAdminAuthError(error.message) };
  }

  revalidatePath("/app/settings/users");
  return { ok: true };
}
