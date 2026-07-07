"use server";

import { isInboxEnabledServer } from "@/lib/supabase/app-settings-queries";

export type InboxFeatureGuardResult =
  | { ok: true }
  | { ok: false; message: string };

export async function assertInboxFeatureEnabled(): Promise<InboxFeatureGuardResult> {
  if (!(await isInboxEnabledServer())) {
    return { ok: false, message: "La funzione Inbox non è attiva." };
  }
  return { ok: true };
}
