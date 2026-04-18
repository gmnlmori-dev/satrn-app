import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateTime } from "@/lib/date";
import { priorityLabel, statusLabel } from "@/lib/labels";
import type { RequestActivityType } from "@/types/activity";
import type { RequestPriority, RequestStatus } from "@/types/request";

/** Inserimento attività: errori solo in console, non blocca il flusso principale. */
export async function insertRequestActivity(
  supabase: SupabaseClient,
  input: {
    requestId: string;
    type: RequestActivityType;
    body: string;
    meta?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { error } = await supabase.from("request_activities").insert({
    request_id: input.requestId,
    type: input.type,
    body: input.body,
    meta: input.meta ?? null,
  });
  if (error) {
    console.error("[request_activities]", error.message);
  }
}

type BeforeOps = {
  status: string;
  priority: string;
  next_action: string;
  next_action_at: string | null;
};

function normAt(v: string | null | undefined): string | null {
  if (v === undefined || v === null || v === "") return null;
  return v;
}

export async function logOperationalChanges(
  supabase: SupabaseClient,
  requestId: string,
  before: BeforeOps,
  fields: {
    status?: string;
    priority?: string;
    next_action?: string;
    next_action_at?: string | null;
  },
): Promise<void> {
  if (fields.status !== undefined && fields.status !== before.status) {
    const from =
      statusLabel[before.status as RequestStatus] ?? before.status;
    const to = statusLabel[fields.status as RequestStatus] ?? fields.status;
    await insertRequestActivity(supabase, {
      requestId,
      type: "status_changed",
      body: `Stato: ${from} → ${to}`,
      meta: { from: before.status, to: fields.status },
    });
  }

  if (fields.priority !== undefined && fields.priority !== before.priority) {
    const from =
      priorityLabel[before.priority as RequestPriority] ?? before.priority;
    const to =
      priorityLabel[fields.priority as RequestPriority] ?? fields.priority;
    await insertRequestActivity(supabase, {
      requestId,
      type: "priority_changed",
      body: `Priorità: ${from} → ${to}`,
      meta: { from: before.priority, to: fields.priority },
    });
  }

  const nextPayload =
    fields.next_action !== undefined || fields.next_action_at !== undefined;
  if (!nextPayload) return;

  const newText = fields.next_action !== undefined ? fields.next_action : before.next_action;
  const newAt =
    fields.next_action_at !== undefined
      ? normAt(fields.next_action_at)
      : normAt(before.next_action_at);

  const textChanged =
    fields.next_action !== undefined &&
    (newText ?? "").trim() !== (before.next_action ?? "").trim();
  const atChanged =
    fields.next_action_at !== undefined &&
    newAt !== normAt(before.next_action_at);

  if (!textChanged && !atChanged) return;

  const parts: string[] = [];
  if (textChanged) {
    parts.push(
      (newText ?? "").trim()
        ? `Testo: ${(newText ?? "").trim().slice(0, 160)}${(newText ?? "").trim().length > 160 ? "…" : ""}`
        : "Testo svuotato",
    );
  }
  if (atChanged) {
    parts.push(
      newAt ? `Scadenza: ${formatDateTime(newAt)}` : "Scadenza rimossa",
    );
  }

  await insertRequestActivity(supabase, {
    requestId,
    type: "next_action_updated",
    body: parts.join(" · "),
    meta: {
      next_action: newText ?? "",
      next_action_at: newAt,
    },
  });
}
