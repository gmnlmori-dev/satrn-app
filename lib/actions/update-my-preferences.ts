"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type DefaultAssignScopePreference,
  type UserPreferences,
} from "@/lib/user-preferences";

export type UpdateMyPreferencesResult =
  | { ok: true }
  | { ok: false; message: string };

function normalizeDefaultAssignScope(
  value: unknown,
): DefaultAssignScopePreference | undefined {
  if (value === "all" || value === "mine") return value;
  return undefined;
}

export async function updateMyPreferences(
  patch: Partial<UserPreferences>,
): Promise<UpdateMyPreferencesResult> {
  const profile = await getCurrentProfileSummary();
  if (!profile) {
    return { ok: false, message: "Sessione non valida." };
  }

  const next: UserPreferences = { ...profile.preferences };

  if ("defaultAssignScope" in patch) {
    const scope = normalizeDefaultAssignScope(patch.defaultAssignScope);
    if (!scope) {
      return { ok: false, message: "Ambito predefinito non valido." };
    }
    next.defaultAssignScope = scope;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ preferences: next })
    .eq("user_id", profile.userId);

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("preferences") && msg.includes("schema cache")) {
      return {
        ok: false,
        message:
          "Preferenza non salvabile: manca la colonna preferences su profiles. Esegui supabase/sql/profile_preferences.sql nel SQL Editor Supabase.",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/requests");
  revalidatePath("/app/dashboard");

  return { ok: true };
}
