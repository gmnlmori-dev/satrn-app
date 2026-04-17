"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase/client";
import { requestNoteRowToNote } from "@/lib/supabase/mappers";
import type { RequestNoteRow } from "@/types/database";
import type { RequestNote } from "@/types/request";

export type CreateRequestNoteResult =
  | { ok: true; note: RequestNote; updatedAt: string; lastInteractionAt: string }
  | { ok: false; message: string };

/**
 * Inserisce una riga in `request_notes` e aggiorna timestamp sulla richiesta collegata.
 */
export async function createRequestNote(
  requestId: string,
  body: string,
): Promise<CreateRequestNoteResult> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, message: "Inserisci un testo per la nota." };
  }

  const supabase = createSupabaseClient();

  const { data: row, error: insertError } = await supabase
    .from("request_notes")
    .insert({ request_id: requestId, body: trimmed })
    .select("*")
    .single();

  if (insertError || !row) {
    return {
      ok: false,
      message: insertError?.message ?? "Errore durante il salvataggio della nota.",
    };
  }

  const noteId = (row as RequestNoteRow).id;

  const now = new Date().toISOString();
  const { data: req, error: updateError } = await supabase
    .from("requests")
    .update({
      last_interaction_at: now,
      updated_at: now,
    })
    .eq("id", requestId)
    .select("updated_at, last_interaction_at")
    .single();

  if (updateError || !req) {
    await supabase.from("request_notes").delete().eq("id", noteId);
    return {
      ok: false,
      message:
        updateError?.message ??
        "Impossibile aggiornare la richiesta dopo il salvataggio della nota.",
    };
  }

  const r = req as { updated_at: string; last_interaction_at: string };
  const note = requestNoteRowToNote(row as RequestNoteRow);

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/dashboard");

  return {
    ok: true,
    note,
    updatedAt: r.updated_at,
    lastInteractionAt: r.last_interaction_at,
  };
}
