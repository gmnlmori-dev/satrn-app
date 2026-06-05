"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidateTaskViews } from "@/lib/task-revalidate";

export type ToggleTaskDoneResult =
  | { ok: true }
  | { ok: false; message: string };

export async function toggleTaskDone(
  taskId: string,
  done: boolean,
): Promise<ToggleTaskDoneResult> {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update({
      done,
      completed_at: done ? nowIso : null,
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTaskViews();
  return { ok: true };
}
