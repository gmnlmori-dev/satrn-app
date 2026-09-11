"use server";

import { revalidatePath } from "next/cache";
import { isAvatarKey, type AvatarKey } from "@/lib/avatars";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateMyAvatarResult =
  | { ok: true; avatarKey: AvatarKey | null }
  | { ok: false; message: string };

/**
 * Imposta (o rimuove con `null`) l'immagine profilo dell'utente corrente.
 * Salvataggio via RPC `update_my_avatar` (supabase/sql/profile_avatar.sql).
 */
export async function updateMyAvatar(
  avatarKey: string | null,
): Promise<UpdateMyAvatarResult> {
  if (avatarKey !== null && !isAvatarKey(avatarKey)) {
    return { ok: false, message: "Immagine profilo non valida." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, message: "Sessione non valida." };
  }

  const { error } = await supabase.rpc("update_my_avatar", {
    key: avatarKey,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      (msg.includes("update_my_avatar") || msg.includes("avatar_key")) &&
      (msg.includes("does not exist") ||
        msg.includes("schema cache") ||
        msg.includes("could not find"))
    ) {
      return {
        ok: false,
        message:
          "Immagine profilo non salvabile: esegui supabase/sql/profile_avatar.sql nel SQL Editor Supabase.",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/settings");

  return { ok: true, avatarKey };
}
