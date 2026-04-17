"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromDatetimeLocalValue } from "@/lib/date";
import type { RequestPriority, RequestStatus } from "@/types/request";

const STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const PRIORITIES: RequestPriority[] = ["high", "medium", "low"];

function parseStatus(value: string): RequestStatus | null {
  return STATUSES.includes(value as RequestStatus)
    ? (value as RequestStatus)
    : null;
}

function parsePriority(value: string): RequestPriority | null {
  return PRIORITIES.includes(value as RequestPriority)
    ? (value as RequestPriority)
    : null;
}

export type CreateRequestResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

/**
 * Inserisce una riga in `public.requests`. Timestamp gestiti da DB o da
 * `last_interaction_at` per coerenza con la UI.
 */
export async function createRequest(fd: FormData): Promise<CreateRequestResult> {
  const title = String(fd.get("title") ?? "").trim();
  const company_name = String(fd.get("companyName") ?? "").trim();
  const contact_name = String(fd.get("contactName") ?? "").trim();
  const contact_email = String(fd.get("contactEmail") ?? "").trim();
  const source = String(fd.get("source") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const next_action = String(fd.get("nextAction") ?? "").trim();
  const nextActionAtRaw = String(fd.get("nextActionAt") ?? "").trim();

  const status = parseStatus(String(fd.get("status") ?? ""));
  const priority = parsePriority(String(fd.get("priority") ?? ""));

  if (!title || !company_name || !contact_name || !contact_email || !description) {
    return { ok: false, message: "Compila tutti i campi obbligatori." };
  }
  if (!status || !priority) {
    return { ok: false, message: "Stato o priorità non validi." };
  }

  const next_action_at = fromDatetimeLocalValue(nextActionAtRaw);

  const supabase = await createSupabaseServerClient();
  const last_interaction_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("requests")
    .insert({
      title,
      company_name,
      contact_name,
      contact_email,
      source,
      status,
      priority,
      description,
      next_action,
      next_action_at,
      last_interaction_at,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }
  const id = data?.id;
  if (!id || typeof id !== "string") {
    return { ok: false, message: "Nessun identificativo restituito dal database." };
  }

  revalidatePath("/app/requests");
  revalidatePath("/app/dashboard");

  return { ok: true, id };
}
