"use server";

import { revalidatePath } from "next/cache";
import { canManageUsers } from "@/lib/permissions";
import type { AppRole } from "@/types/profile";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
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
}): Promise<AdminUpdateProfileResult> {
  const actor = await getCurrentProfileSummary();
  if (!actor?.userId || !actor.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }
  if (!canManageUsers(actor.role)) {
    return { ok: false, message: "Solo l’admin può gestire utenti e ruoli." };
  }

  if (params.userId === actor.userId) {
    if (params.is_active === false) {
      return { ok: false, message: "Non puoi disattivare il tuo stesso utente admin." };
    }
    if (params.role !== undefined && params.role !== "admin") {
      return {
        ok: false,
        message: "Non puoi rimuovere il ruolo admin a te stesso.",
      };
    }
  }

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
