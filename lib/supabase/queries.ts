import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  requestNoteRowToNote,
  requestRowToRequest,
} from "@/lib/supabase/mappers";
import type { RequestNoteRow, RequestRow } from "@/types/database";
import type { Request, RequestNote } from "@/types/request";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

/** Tutte le richieste, ultimo aggiornamento per primo. */
export async function getRequests(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("updated_at", { ascending: false });

  assertNoError("getRequests", error);
  return ((data ?? []) as RequestRow[]).map(requestRowToRequest);
}

/** Singola richiesta per id, o `null` se assente. */
export async function getRequestById(id: string): Promise<Request | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError("getRequestById", error);
  if (!data) return null;
  return requestRowToRequest(data as RequestRow);
}

/** Note collegate a una richiesta (cronologia). */
export async function getRequestNotes(requestId: string): Promise<RequestNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("request_notes")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  assertNoError("getRequestNotes", error);
  return ((data ?? []) as RequestNoteRow[]).map(requestNoteRowToNote);
}
