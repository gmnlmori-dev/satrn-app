"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidateTaskViews } from "@/lib/task-revalidate";

export type DeleteTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteTask(taskId: string): Promise<DeleteTaskResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTaskViews();
  return { ok: true };
}
