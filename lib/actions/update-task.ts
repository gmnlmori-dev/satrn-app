"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidateTaskViews } from "@/lib/task-revalidate";
import { nextActionAtFromFormData } from "@/lib/date";

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
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("tasks")
    .update({ title, due_at })
    .eq("id", taskId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTaskViews();
  return { ok: true };
}
