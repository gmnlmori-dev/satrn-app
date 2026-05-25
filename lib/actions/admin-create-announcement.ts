"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActor } from "@/lib/actions/admin-auth-guard";
import {
  parseAnnouncementInput,
  revalidateAnnouncementPaths,
  type AnnouncementInput,
} from "@/lib/actions/announcement-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCreateAnnouncementResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function adminCreateAnnouncement(
  params: AnnouncementInput,
): Promise<AdminCreateAnnouncementResult> {
  const guard = await assertAdminActor();
  if (!guard.ok) return guard;

  const parsed = parseAnnouncementInput(params);
  if (!parsed.ok) return parsed;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_announcements")
    .insert({
      ...parsed.data,
      created_by_user_id: guard.actor.userId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("app_announcements")) {
      return {
        ok: false,
        message:
          "Tabella novità assente. Esegui supabase/sql/app_announcements.sql nel SQL Editor Supabase.",
      };
    }
    return { ok: false, message: error.message };
  }

  const id = data?.id;
  if (!id || typeof id !== "string") {
    return { ok: false, message: "Novità creata ma identificativo assente." };
  }

  for (const path of revalidateAnnouncementPaths()) {
    revalidatePath(path);
  }

  return { ok: true, id };
}
