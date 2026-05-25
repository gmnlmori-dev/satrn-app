"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import { revalidateAnnouncementPaths } from "@/lib/actions/announcement-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminDeleteAnnouncementResult =
  | { ok: true }
  | { ok: false; message: string };

export async function adminDeleteAnnouncement(
  id: string,
): Promise<AdminDeleteAnnouncementResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const announcementId = id.trim();
  if (!announcementId) {
    return { ok: false, message: "Identificativo novità mancante." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    return { ok: false, message: error.message };
  }

  for (const path of revalidateAnnouncementPaths()) {
    revalidatePath(path);
  }

  return { ok: true };
}
