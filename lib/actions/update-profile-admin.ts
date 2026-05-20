"use server";

import { revalidatePath } from "next/cache";
import type { AppRole } from "@/types/profile";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import {
  assertSelfAdminGuards,
  mapAdminAuthError,
  validateEmail,
} from "@/lib/actions/admin-auth-errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUpdateProfileResult =
  | { ok: true }
  | { ok: false; message: string };

const ROLES: AppRole[] = ["admin", "manager", "operator"];

function normalizeRole(role: unknown): role is AppRole {
  return typeof role === "string" && ROLES.includes(role as AppRole);
}

export async function adminUpdateProfile(params: {
  userId: string;
  role?: AppRole;
  is_active?: boolean;
  full_name?: string;
  email?: string;
}): Promise<AdminUpdateProfileResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;
  const actor = guard.actor;

  const selfErr = assertSelfAdminGuards(actor.userId, params.userId, {
    role: params.role,
    is_active: params.is_active,
  });
  if (selfErr) return { ok: false, message: selfErr };

  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};

  if (params.role !== undefined) {
    if (!normalizeRole(params.role)) {
      return { ok: false, message: "Ruolo non valido." };
    }
    patch.role = params.role;
  }

  if (params.is_active !== undefined) patch.is_active = params.is_active;

  if (params.full_name !== undefined) {
    patch.full_name =
      typeof params.full_name === "string" ? params.full_name.trim() : "";
  }

  if (params.email !== undefined) {
    const emailErr = validateEmail(params.email);
    if (emailErr) return { ok: false, message: emailErr };
    const newEmail = params.email.trim();

    const admin = createSupabaseAdminClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(
      params.userId,
      { email: newEmail },
    );
    if (authErr) {
      return { ok: false, message: mapAdminAuthError(authErr.message) };
    }
    patch.email = newEmail;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "Nessun campo da aggiornare." };
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("user_id", params.userId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/app/settings/users");
  return { ok: true };
}
