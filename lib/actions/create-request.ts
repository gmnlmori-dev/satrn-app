"use server";

import { revalidatePath } from "next/cache";
import { formatAssigneeList } from "@/lib/request-assignees";
import { validateAssigneeProfiles } from "@/lib/assignee-validation";
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
  if (!p) return "Utente sconosciuto";
  const n = (p.full_name ?? "").trim();
  const e = (p.email ?? "").trim();
  if (n && e) return `${n} (${e})`;
  return n || e || "Utente sconosciuto";
}

function parseAssigneeIds(fd: FormData, fallbackUserId: string): string[] {
  const raw = fd
    .getAll("assignedUserIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const unique = [...new Set(raw.length > 0 ? raw : [fallbackUserId])];
  return unique;
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

  const assigneeUserIds = canAssignRequests(me.role)
    ? parseAssigneeIds(fd, me.userId)
    : [me.userId];

  const supabase = await createSupabaseServerClient();
  const last_interaction_at = new Date().toISOString();

  const { data: assigneeRows, error: assigneeErr } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, is_active, team_id")
    .in("user_id", assigneeUserIds);

  if (assigneeErr) {
    return { ok: false, message: assigneeErr.message };
  }

  const profiles = (assigneeRows ?? []) as {
    user_id: string;
    full_name: string | null;
    email: string | null;
    is_active: boolean;
    team_id: string;
  }[];

  if (profiles.length !== assigneeUserIds.length) {
    return {
      ok: false,
      message: "Uno o più destinatari assegnazione non trovati.",
    };
  }

  const assigneeCheck = validateAssigneeProfiles(
    profiles,
    assigneeUserIds,
    team_id,
    me.role,
  );
  if (!assigneeCheck.ok) return assigneeCheck;

  const assigned_user_id = assigneeUserIds[0] ?? null;
  const assigned_at = assigned_user_id ? last_interaction_at : null;

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
      created_by_user_id: me.userId,
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

  if (assigneeUserIds.length > 0) {
    const { error: assigneeInsertErr } = await supabase
      .from("request_assignees")
      .insert(
        assigneeUserIds.map((userId) => ({
          request_id: id,
          user_id: userId,
          assigned_at: last_interaction_at,
          assigned_by_user_id: me.userId,
        })),
      );

    if (assigneeInsertErr) {
      return { ok: false, message: assigneeInsertErr.message };
    }
  }

  await insertRequestActivity(supabase, {
    requestId: id,
    type: "request_created",
    body: `Richiesta creata: ${title}`,
  });

  const assigneeLabels = profiles.map((profile) =>
    assigneeCaption({
      full_name: profile.full_name,
      email: profile.email,
    }),
  );

  await insertRequestActivity(supabase, {
    requestId: id,
    type: "assigned_user_changed",
    body: `Assegnazione: Nessuno → ${formatAssigneeList(
      assigneeLabels.map((label) => ({ label })),
    )}`,
    meta: {
      from_assigned_user_id: null,
      to_assigned_user_id: assigned_user_id,
      from_assigned_user_ids: [],
      to_assigned_user_ids: assigneeUserIds,
      changed_by_user_id: me.userId,
    },
  });

  revalidatePath("/app/requests");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");
  revalidatePath(`/app/requests/${id}`);

  return { ok: true, id };
}
