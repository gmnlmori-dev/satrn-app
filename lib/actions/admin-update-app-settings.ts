"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import { mergeAppSettings, type AppSettings } from "@/lib/app-settings";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUpdateAppSettingsResult =
  | { ok: true }
  | { ok: false; message: string };

const GLOBAL_SETTINGS_ID = "global";

export async function adminUpdateAppSettings(
  patch: Partial<AppSettings>,
): Promise<AdminUpdateAppSettingsResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  if (patch.inboxEnabled === undefined) {
    return { ok: false, message: "Nessun campo da aggiornare." };
  }

  const current = await getAppSettings();
  const next = mergeAppSettings(current, patch);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      settings: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", GLOBAL_SETTINGS_ID);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/settings/users");
  return { ok: true };
}
