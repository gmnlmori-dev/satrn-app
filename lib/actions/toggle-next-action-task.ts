"use server";

import { revalidatePath } from "next/cache";
import { insertRequestActivity } from "@/lib/request-activity-log";
import {
  parseNextAction,
  patchNextActionTask,
} from "@/lib/next-action-tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ToggleNextActionTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function toggleNextActionTask(
  requestId: string,
  taskId: string,
  done: boolean,
): Promise<ToggleNextActionTaskResult> {
  const supabase = await createSupabaseServerClient();

  const { data: row, error: loadError } = await supabase
    .from("requests")
    .select("next_action")
    .eq("id", requestId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, message: loadError.message };
  }
  if (!row) {
    return { ok: false, message: "Richiesta non trovata." };
  }

  const before = (row as { next_action: string }).next_action ?? "";
  const next = patchNextActionTask(before, taskId, { done });
  if (!next) {
    return { ok: false, message: "Task non trovato." };
  }

  const { error } = await supabase
    .from("requests")
    .update({ next_action: next })
    .eq("id", requestId);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (done) {
    const task = parseNextAction(next).tasks.find((item) => item.id === taskId);
    if (task) {
      const preview = task.text.trim().slice(0, 160);
      await insertRequestActivity(supabase, {
        requestId,
        type: "next_action_updated",
        body: preview ? `Task completato: ${preview}` : "Task completato",
        meta: { taskId, done: true },
      });
    }
  }

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");

  return { ok: true };
}
