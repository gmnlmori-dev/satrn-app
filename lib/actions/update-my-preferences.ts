"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type DefaultAssignScopePreference,
  type DefaultHomePagePreference,
  type DefaultRequestsCalendarLayoutPreference,
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

function normalizeDefaultRequestsCalendarLayout(
  value: unknown,
): DefaultRequestsCalendarLayoutPreference | undefined {
  if (value === "month" || value === "week") return value;
  return undefined;
}

function normalizeDefaultHomePage(
  value: unknown,
): DefaultHomePagePreference | undefined {
  if (
    value === "dashboard" ||
    value === "follow-up" ||
    value === "requests" ||
    value === "calendar"
  ) {
    return value;
  }
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

  if ("defaultRequestsCalendarLayout" in patch) {
    const layout = normalizeDefaultRequestsCalendarLayout(
      patch.defaultRequestsCalendarLayout,
    );
    if (!layout) {
      return { ok: false, message: "Layout calendario non valido." };
    }
    next.defaultRequestsCalendarLayout = layout;
  }

  if ("defaultHomePage" in patch) {
    const home = normalizeDefaultHomePage(patch.defaultHomePage);
    if (!home) {
      return { ok: false, message: "Pagina predefinita non valida." };
    }
    next.defaultHomePage = home;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_my_preferences", {
    prefs: next,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("update_my_preferences") &&
      (msg.includes("does not exist") ||
        msg.includes("schema cache") ||
        msg.includes("could not find"))
    ) {
      return {
        ok: false,
        message:
          "Preferenza non salvabile: esegui supabase/sql/profile_preferences.sql nel SQL Editor Supabase.",
      };
    }
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
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/inbox");
  revalidatePath("/");
  revalidatePath("/app");

  return { ok: true };
}
