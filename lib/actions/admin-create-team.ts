"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import { slugifyName } from "@/lib/team-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCreateTeamResult =
  | { ok: true; teamId: string }
  | { ok: false; message: string };

export async function adminCreateTeam(params: {
  name: string;
  slug?: string;
  is_active?: boolean;
}): Promise<AdminCreateTeamResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const name = params.name.trim();
  if (!name) {
    return { ok: false, message: "Il nome del team è obbligatorio." };
  }

  const slug = (params.slug?.trim() || slugifyName(name)).toLowerCase();
  if (!slug) {
    return { ok: false, message: "Slug non valido." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      message: "Slug non valido: usa solo lettere minuscole, numeri e trattini.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      slug,
      is_active: params.is_active !== false,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Esiste già un team con questo slug." };
    }
    return { ok: false, message: error.message };
  }

  const teamId = data?.id;
  if (!teamId || typeof teamId !== "string") {
    return { ok: false, message: "Team creato ma identificativo assente." };
  }

  revalidatePath("/app/settings/teams");
  revalidatePath("/app/settings/users");
  return { ok: true, teamId };
}
