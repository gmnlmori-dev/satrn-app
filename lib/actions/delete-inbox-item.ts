"use server";

import { revalidatePath } from "next/cache";
import { canDeleteInboxItem } from "@/lib/inbox-delete";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteInboxItemResult =
  | { ok: true }
  | { ok: false; message: string };

/** Elimina un ingresso inbox creato dall'utente, se non ancora convertito. */
export async function deleteInboxItem(
  inboxItemId: string,
): Promise<DeleteInboxItemResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row, error: loadErr } = await supabase
    .from("inbox_items")
    .select("id, team_id, created_by_user_id, assigned_user_id, linked_request_id, status")
    .eq("id", inboxItemId)
    .maybeSingle();

  if (loadErr) return { ok: false, message: loadErr.message };
  if (!row) return { ok: false, message: "Ingresso non trovato." };

  const item = {
    createdByUserId: (row.created_by_user_id as string | null) ?? null,
    assignedUserId: (row.assigned_user_id as string | null) ?? null,
    linkedRequestId: (row.linked_request_id as string | null) ?? null,
    status: row.status as "new" | "reviewed" | "converted" | "archived",
  };

  if (!canDeleteInboxItem(item, me.userId)) {
    return {
      ok: false,
      message:
        "Puoi eliminare solo i tuoi ingressi non ancora convertiti in richiesta.",
    };
  }

  const { error: delErr } = await supabase
    .from("inbox_items")
    .delete()
    .eq("id", inboxItemId);

  if (delErr) return { ok: false, message: delErr.message };

  revalidatePath("/app/inbox");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/dashboard");

  return { ok: true };
}
