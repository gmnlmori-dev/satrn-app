"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUpdateTeamResult =
  | { ok: true }
  | { ok: false; message: string };

export async function adminUpdateTeam(params: {
  teamId: string;
  name?: string;
  slug?: string;
  is_active?: boolean;
}): Promise<AdminUpdateTeamResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const patch: Record<string, unknown> = {};

  if (params.name !== undefined) {
    const name = params.name.trim();
    if (!name) {
      return { ok: false, message: "Il nome del team è obbligatorio." };
    }
    patch.name = name;
  }

  if (params.slug !== undefined) {
    const slug = params.slug.trim().toLowerCase();
    if (!slug) {
      return { ok: false, message: "Slug non valido." };
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return {
        ok: false,
        message: "Slug non valido: usa solo lettere minuscole, numeri e trattini.",
      };
    }
    patch.slug = slug;
  }

  if (params.is_active !== undefined) patch.is_active = params.is_active;

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "Nessun campo da aggiornare." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("teams")
    .update(patch)
    .eq("id", params.teamId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Esiste già un team con questo slug." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/app/settings/teams");
  revalidatePath("/app/settings/users");
  return { ok: true };
}
