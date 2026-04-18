"use server";

import { revalidatePath } from "next/cache";
import { createRequest } from "@/lib/actions/create-request";
import { insertRequestActivity } from "@/lib/request-activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInboxItemById } from "@/lib/supabase/inbox-queries";

export type ConvertInboxToRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; message: string };

/**
 * Crea una riga in `requests` (come `createRequest`) e collega l’inbox item.
 */
export async function convertInboxToRequest(
  inboxItemId: string,
  fd: FormData,
): Promise<ConvertInboxToRequestResult> {
  const item = await getInboxItemById(inboxItemId);
  if (!item) {
    return { ok: false, message: "Elemento non trovato." };
  }
  if (item.linkedRequestId) {
    return {
      ok: false,
      message: "Questo elemento è già collegato a una richiesta.",
    };
  }

  const result = await createRequest(fd);
  if (!result.ok) {
    return result;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("inbox_items")
    .update({
      status: "converted",
      linked_request_id: result.id,
    })
    .eq("id", inboxItemId);

  if (error) {
    return {
      ok: false,
      message: `Richiesta creata ma aggiornamento inbox fallito: ${error.message}`,
    };
  }

  await insertRequestActivity(supabase, {
    requestId: result.id,
    type: "converted_from_inbox",
    body: "Richiesta creata dalla conversione inbox.",
    meta: { inbox_item_id: inboxItemId },
  });

  revalidatePath("/app/inbox");
  revalidatePath(`/app/inbox/${inboxItemId}`);
  revalidatePath("/app/requests");
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/requests/${result.id}`);
  revalidatePath("/app/follow-up");

  return { ok: true, requestId: result.id };
}
