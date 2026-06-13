"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeNextDueAt,
  parseTaskRecurrence,
  recurrenceSeriesEndedAfterComplete,
} from "@/lib/task-recurrence";
import { revalidateTaskViews } from "@/lib/task-revalidate";
import type { TaskRecurrence } from "@/types/task";

export type ToggleTaskDoneResult =
  | {
      ok: true;
      done: boolean;
      dueAt: string | null;
      completedAt: string | null;
      recurrence: TaskRecurrence | null;
    }
  | { ok: false; message: string };

export async function toggleTaskDone(
  taskId: string,
  done: boolean,
): Promise<ToggleTaskDoneResult> {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const { data: row, error: fetchErr } = await supabase
    .from("tasks")
    .select("due_at, recurrence")
    .eq("id", taskId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, message: fetchErr.message };
  }
  if (!row) {
    return { ok: false, message: "Task non trovata." };
  }

  const dueAt = (row as { due_at: string | null }).due_at;
  const rule = parseTaskRecurrence(
    (row as { recurrence?: unknown }).recurrence ?? null,
  );

  if (done && rule && dueAt) {
    const updatedRule: TaskRecurrence = {
      ...rule,
      completedCount: rule.completedCount + 1,
    };
    const nextDueAt = computeNextDueAt(updatedRule, dueAt);

    if (recurrenceSeriesEndedAfterComplete(rule, nextDueAt)) {
      const { error } = await supabase
        .from("tasks")
        .update({
          done: true,
          completed_at: nowIso,
          recurrence: null,
        })
        .eq("id", taskId);

      if (error) return { ok: false, message: error.message };
      revalidateTaskViews();
      return {
        ok: true,
        done: true,
        dueAt,
        completedAt: nowIso,
        recurrence: null,
      };
    }

    if (nextDueAt) {
      const { error } = await supabase
        .from("tasks")
        .update({
          done: false,
          completed_at: null,
          due_at: nextDueAt,
          recurrence: updatedRule,
        })
        .eq("id", taskId);

      if (error) return { ok: false, message: error.message };
      revalidateTaskViews();
      return {
        ok: true,
        done: false,
        dueAt: nextDueAt,
        completedAt: null,
        recurrence: updatedRule,
      };
    }
  }

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
  return {
    ok: true,
    done,
    dueAt,
    completedAt: done ? nowIso : null,
    recurrence: rule,
  };
}
