"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import {
  parseAnnouncementInput,
  revalidateAnnouncementPaths,
  type AnnouncementInput,
} from "@/lib/actions/announcement-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUpdateAnnouncementResult =
  | { ok: true }
  | { ok: false; message: string };

export async function adminUpdateAnnouncement(
  id: string,
  params: AnnouncementInput,
): Promise<AdminUpdateAnnouncementResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const announcementId = id.trim();
  if (!announcementId) {
    return { ok: false, message: "Identificativo novità mancante." };
  }

  const parsed = parseAnnouncementInput(params);
  if (!parsed.ok) return parsed;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_announcements")
    .update(parsed.data)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, message: error.message };
  }

  for (const path of revalidateAnnouncementPaths()) {
    revalidatePath(path);
  }

  return { ok: true };
}
