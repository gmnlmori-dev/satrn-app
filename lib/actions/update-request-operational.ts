"use server";

import { revalidatePath } from "next/cache";
import { validateNextActionDeadlineAlignment } from "@/lib/next-action-deadline-validation";
import { logOperationalChanges } from "@/lib/request-activity-log";
import { markAllNextActionTasksDone } from "@/lib/next-action-tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateRequestOperationalInput = {
  status?: string;
  priority?: string;
  next_action?: string;
  next_action_at?: string | null;
  /** Se true, imposta `last_interaction_at` a now (es. salvataggio “Prossima azione”). */
  bump_last_interaction?: boolean;
};

export type UpdateRequestOperationalResult =
  | { ok: true; updatedAt: string; lastInteractionAt: string }
  | { ok: false; message: string };

/**
 * Aggiorna campi operativi su `public.requests`. `updated_at` è gestito dal DB se hai DEFAULT/trigger.
 */
export async function updateRequestOperational(
  id: string,
  fields: UpdateRequestOperationalInput,
): Promise<UpdateRequestOperationalResult> {
  const supabase = await createSupabaseServerClient();

  const { data: before, error: loadError } = await supabase
    .from("requests")
    .select("status, priority, next_action, next_action_at")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return { ok: false, message: loadError.message };
  }
  if (!before) {
    return { ok: false, message: "Progetto non trovato." };
  }

  const beforeRow = before as {
    status: string;
    priority: string;
    next_action: string;
    next_action_at: string | null;
  };

  const nextActionAt =
    fields.next_action_at !== undefined
      ? fields.next_action_at
      : beforeRow.next_action_at;
  const nextActionRaw =
    fields.next_action !== undefined
      ? fields.next_action
      : beforeRow.next_action ?? "";

  if (
    fields.next_action_at !== undefined ||
    fields.next_action !== undefined
  ) {
    const deadlineCheck = validateNextActionDeadlineAlignment(
      nextActionAt,
      nextActionRaw,
    );
    if (!deadlineCheck.ok) return deadlineCheck;
  }

  const payload: Record<string, unknown> = {};
  if (fields.status !== undefined) payload.status = fields.status;
  if (fields.priority !== undefined) payload.priority = fields.priority;
  if (fields.next_action !== undefined) payload.next_action = fields.next_action;
  if (fields.next_action_at !== undefined) {
    payload.next_action_at = fields.next_action_at;
  }
  if (fields.bump_last_interaction) {
    payload.last_interaction_at = new Date().toISOString();
  }

  if (
    fields.status === "closed" &&
    before.status !== "closed"
  ) {
    const marked = markAllNextActionTasksDone(beforeRow.next_action ?? "");
    if (marked.changed) {
      payload.next_action = marked.next;
    }
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, message: "Nessun campo da aggiornare." };
  }

  const { data, error } = await supabase
    .from("requests")
    .update(payload)
    .eq("id", id)
    .select("updated_at, last_interaction_at")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const row = data as {
    updated_at: string;
    last_interaction_at: string;
  };

  await logOperationalChanges(supabase, id, beforeRow, fields);

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${id}`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");

  return {
    ok: true,
    updatedAt: row.updated_at,
    lastInteractionAt: row.last_interaction_at,
  };
}
