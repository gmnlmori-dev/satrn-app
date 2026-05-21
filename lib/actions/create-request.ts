"use server";

import { revalidatePath } from "next/cache";
import { canAssignRequests } from "@/lib/permissions";
import { insertRequestActivity } from "@/lib/request-activity-log";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextActionAtFromFormData } from "@/lib/date";
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

function assigneeCaption(
  p: {
    full_name: string | null;
    email: string | null;
  } | null,
): string {
  if (!p) return "Nessuno";
  const n = (p.full_name ?? "").trim();
  const e = (p.email ?? "").trim();
  if (n && e) return `${n} (${e})`;
  return n || e || "Utente sconosciuto";
}

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

  const status = parseStatus(String(fd.get("status") ?? ""));
  const priority = parsePriority(String(fd.get("priority") ?? ""));

  if (!title) {
    return { ok: false, message: "Il titolo è obbligatorio." };
  }
  if (!status || !priority) {
    return { ok: false, message: "Stato o priorità non validi." };
  }

  const next_action_at = nextActionAtFromFormData(fd);

  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false, message: "Sessione non valida." };
  }

  let team_id = me.teamId;
  if (me.role === "admin") {
    const teamIdFromForm = String(fd.get("teamId") ?? "").trim();
    if (teamIdFromForm) team_id = teamIdFromForm;
  }

  const supabase = await createSupabaseServerClient();
  const last_interaction_at = new Date().toISOString();

  let assigneeUserId = me.userId;
  if (canAssignRequests(me.role)) {
    const rawAssignee = String(fd.get("assignedUserId") ?? "").trim();
    if (rawAssignee) assigneeUserId = rawAssignee;
  }

  const { data: assigneeProfileRow, error: assigneeErr } = await supabase
    .from("profiles")
    .select("full_name, email, is_active, team_id")
    .eq("user_id", assigneeUserId)
    .maybeSingle();

  if (assigneeErr || !assigneeProfileRow) {
    return {
      ok: false,
      message: "Destinatario assegnazione non trovato.",
    };
  }
  if (!(assigneeProfileRow as { is_active: boolean }).is_active) {
    return { ok: false, message: "L’utente selezionato non è attivo." };
  }
  if ((assigneeProfileRow as { team_id: string }).team_id !== team_id) {
    return {
      ok: false,
      message: "L’utente selezionato non appartiene al team della richiesta.",
    };
  }

  const assigneeProfile = {
    full_name: (assigneeProfileRow as { full_name: string | null }).full_name ?? null,
    email: (assigneeProfileRow as { email: string | null }).email ?? null,
  };
  const assigned_user_id = assigneeUserId;
  const assigned_at = last_interaction_at;

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
      team_id,
      assigned_user_id,
      assigned_at,
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

  await insertRequestActivity(supabase, {
    requestId: id,
    type: "request_created",
    body: `Richiesta creata: ${title}`,
  });

  await insertRequestActivity(supabase, {
    requestId: id,
    type: "assigned_user_changed",
    body: `Assegnazione: Nessuno → ${assigneeCaption(assigneeProfile)}`,
    meta: {
      from_assigned_user_id: null,
      to_assigned_user_id: assigned_user_id,
      changed_by_user_id: me.userId,
    },
  });

  revalidatePath("/app/requests");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
  revalidatePath(`/app/requests/${id}`);

  return { ok: true, id };
}
