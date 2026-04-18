"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInboxItemById } from "@/lib/supabase/inbox-queries";
import type { InboxItemStatus } from "@/types/inbox";

const MANUAL: InboxItemStatus[] = ["new", "reviewed", "archived"];

export type UpdateInboxStatusResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateInboxItemStatus(
  id: string,
  next: InboxItemStatus,
): Promise<UpdateInboxStatusResult> {
  if (!MANUAL.includes(next)) {
    return { ok: false, message: "Stato non valido per aggiornamento manuale." };
  }

  const existing = await getInboxItemById(id);
  if (!existing) {
    return { ok: false, message: "Elemento non trovato." };
  }
  if (existing.status === "converted" || existing.linkedRequestId) {
    return {
      ok: false,
      message: "Gli elementi convertiti non possono cambiare stato da qui.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("inbox_items")
    .update({ status: next })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/app/inbox");
  revalidatePath(`/app/inbox/${id}`);
  revalidatePath("/app/follow-up");

  return { ok: true };
}
