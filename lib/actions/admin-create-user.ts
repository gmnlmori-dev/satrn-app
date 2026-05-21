"use server";

import { revalidatePath } from "next/cache";
import type { AppRole } from "@/types/profile";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import {
  mapAdminAuthError,
  validateEmail,
  validatePassword,
} from "@/lib/actions/admin-auth-errors";
import { adminUpdateProfile } from "@/lib/actions/update-profile-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ROLES: AppRole[] = ["admin", "manager", "operator"];

export type AdminCreateUserResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

export async function adminCreateUser(params: {
  email: string;
  password: string;
  full_name?: string;
  role?: AppRole;
  is_active?: boolean;
  team_id: string;
}): Promise<AdminCreateUserResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const emailErr = validateEmail(params.email);
  if (emailErr) return { ok: false, message: emailErr };

  const pwErr = validatePassword(params.password);
  if (pwErr) return { ok: false, message: pwErr };

  const role =
    params.role && ROLES.includes(params.role) ? params.role : "operator";
  const fullName = (params.full_name ?? "").trim();
  const isActive = params.is_active !== false;
  const teamId = params.team_id?.trim();
  if (!teamId) {
    return { ok: false, message: "Il team è obbligatorio." };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email.trim(),
    password: params.password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) {
    return { ok: false, message: mapAdminAuthError(error.message) };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { ok: false, message: "Utente creato ma identificativo assente." };
  }

  const profilePatch: Parameters<typeof adminUpdateProfile>[0] = {
    userId,
    team_id: teamId,
  };
  if (role !== "operator") profilePatch.role = role;
  if (fullName) profilePatch.full_name = fullName;
  if (!isActive) profilePatch.is_active = false;

  if (
    profilePatch.role !== undefined ||
    profilePatch.full_name !== undefined ||
    profilePatch.is_active !== undefined ||
    profilePatch.team_id !== undefined
  ) {
    const upd = await adminUpdateProfile(profilePatch);
    if (!upd.ok) {
      return {
        ok: false,
        message: `Utente creato ma profilo non aggiornato: ${upd.message}`,
      };
    }
  } else {
    revalidatePath("/app/settings/users");
  }

  return { ok: true, userId };
}
