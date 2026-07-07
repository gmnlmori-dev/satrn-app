import {
  DEFAULT_APP_SETTINGS,
  isInboxEnabled,
  parseAppSettings,
  type AppSettings,
} from "@/lib/app-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GLOBAL_SETTINGS_ID = "global";

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("settings")
    .eq("id", GLOBAL_SETTINGS_ID)
    .maybeSingle();

  if (error || !data?.settings) {
    return DEFAULT_APP_SETTINGS;
  }

  return parseAppSettings(data.settings);
}

export async function isInboxEnabledServer(): Promise<boolean> {
  const settings = await getAppSettings();
  return isInboxEnabled(settings);
}
