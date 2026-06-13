"use server";

import { nextActionAtFromFormData } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseTaskRecurrence,
  recurrenceFromFormData,
  recurrenceRulesEqual,
  validateTaskRecurrence,
} from "@/lib/task-recurrence";
import { revalidateTaskViews } from "@/lib/task-revalidate";

export type UpdateTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateTask(
  taskId: string,
  fd: FormData,
): Promise<UpdateTaskResult> {
  const title = String(fd.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, message: "Il titolo è obbligatorio." };
  }

  const due_at = nextActionAtFromFormData(fd);
  const recurrenceEnabled = String(fd.get("recurrenceEnabled") ?? "") === "1";
  const supabase = await createSupabaseServerClient();

  const { data: existingRow, error: fetchErr } = await supabase
    .from("tasks")
    .select("recurrence")
    .eq("id", taskId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, message: fetchErr.message };
  }

  const previous = parseTaskRecurrence(
    (existingRow as { recurrence?: unknown } | null)?.recurrence ?? null,
  );
  let recurrence = recurrenceFromFormData(fd, due_at, previous);

  if (recurrenceEnabled && !due_at) {
    return { ok: false, message: "Imposta la prima scadenza per una task ricorrente." };
  }
  if (recurrenceEnabled && !recurrence) {
    return { ok: false, message: "Controlla frequenza e termine della ripetizione." };
  }

  if (recurrence) {
    if (previous && recurrenceRulesEqual(recurrence, previous)) {
      recurrence = { ...recurrence, completedCount: previous.completedCount };
    } else {
      recurrence = { ...recurrence, completedCount: 0 };
    }
    const recurrenceError = validateTaskRecurrence(recurrence, due_at);
    if (recurrenceError) return { ok: false, message: recurrenceError };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ title, due_at, recurrence })
    .eq("id", taskId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTaskViews();
  return { ok: true };
}

export async function updateTaskDueAt(
  taskId: string,
  dueAt: string,
): Promise<UpdateTaskResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("tasks")
    .update({ due_at: dueAt })
    .eq("id", taskId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTaskViews();
  return { ok: true };
}
