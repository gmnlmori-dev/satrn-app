"use server";

import { revalidatePath } from "next/cache";
import { revalidateAnnouncementPaths } from "@/lib/actions/announcement-validation";
import {
  createSupabaseServerClient,
  getAuthUserId,
} from "@/lib/supabase/server";

export type MarkAnnouncementReadResult =
  | { ok: true }
  | { ok: false; message: string };

export async function markAnnouncementRead(
  announcementId: string,
): Promise<MarkAnnouncementReadResult> {
  const id = announcementId.trim();
  if (!id) {
    return { ok: false, message: "Identificativo novità mancante." };
  }

  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, message: "Sessione non valida." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("app_announcement_reads").upsert(
    {
      user_id: userId,
      announcement_id: id,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,announcement_id" },
  );

  if (error) {
    if (error.message.includes("app_announcement_reads")) {
      return {
        ok: false,
        message:
          "Tabella letture novità assente. Esegui supabase/sql/app_announcements.sql.",
      };
    }
    return { ok: false, message: error.message };
  }

  for (const path of revalidateAnnouncementPaths()) {
    revalidatePath(path);
  }

  return { ok: true };
}
