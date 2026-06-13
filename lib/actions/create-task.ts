"use server";

import { validateAssigneeProfiles } from "@/lib/assignee-validation";
import { nextActionAtFromFormData } from "@/lib/date";
import { canAssignRequests } from "@/lib/permissions";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  recurrenceFromFormData,
  validateTaskRecurrence,
} from "@/lib/task-recurrence";
import { revalidateTaskViews } from "@/lib/task-revalidate";

export type CreateTaskResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function parseAssigneeIds(fd: FormData, fallbackUserId: string): string[] {
  const raw = fd
    .getAll("assignedUserIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  return [...new Set(raw.length > 0 ? raw : [fallbackUserId])];
}

export async function createTask(fd: FormData): Promise<CreateTaskResult> {
  const title = String(fd.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, message: "Il titolo è obbligatorio." };
  }

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

  const due_at = nextActionAtFromFormData(fd);
  const recurrenceEnabled = String(fd.get("recurrenceEnabled") ?? "") === "1";
  const recurrence = recurrenceFromFormData(fd, due_at);

  if (recurrenceEnabled && !due_at) {
    return { ok: false, message: "Imposta la prima scadenza per una task ricorrente." };
  }
  if (recurrenceEnabled && !recurrence) {
    return { ok: false, message: "Controlla frequenza e termine della ripetizione." };
  }
  if (recurrence) {
    const recurrenceError = validateTaskRecurrence(recurrence, due_at);
    if (recurrenceError) return { ok: false, message: recurrenceError };
  }

  const supabase = await createSupabaseServerClient();

  const { data: assigneeRows, error: assigneeErr } = await supabase
    .from("profiles")
    .select("user_id, is_active, team_id")
    .in("user_id", assigneeUserIds);

  if (assigneeErr) {
    return { ok: false, message: assigneeErr.message };
  }

  const profiles = (assigneeRows ?? []) as {
    user_id: string;
    is_active: boolean;
    team_id: string;
  }[];

  if (profiles.length !== assigneeUserIds.length) {
    return { ok: false, message: "Uno o più destinatari non sono validi." };
  }

  const assigneeCheck = validateAssigneeProfiles(
    profiles.map((p) => ({
      user_id: p.user_id,
      full_name: null,
      email: null,
      is_active: p.is_active,
      team_id: p.team_id,
    })),
    assigneeUserIds,
    team_id,
    me.role,
  );
  if (!assigneeCheck.ok) return assigneeCheck;

  const { data: taskRow, error: insertErr } = await supabase
    .from("tasks")
    .insert({
      team_id,
      created_by_user_id: me.userId,
      title,
      due_at,
      recurrence,
    })
    .select("id")
    .single();

  if (insertErr || !taskRow) {
    return {
      ok: false,
      message: insertErr?.message ?? "Errore durante la creazione della task.",
    };
  }

  const taskId = (taskRow as { id: string }).id;
  const nowIso = new Date().toISOString();

  const { error: assignErr } = await supabase.from("task_assignees").insert(
    assigneeUserIds.map((userId) => ({
      task_id: taskId,
      user_id: userId,
      assigned_at: nowIso,
      assigned_by_user_id: me.userId,
    })),
  );

  if (assignErr) {
    await supabase.from("tasks").delete().eq("id", taskId);
    return { ok: false, message: assignErr.message };
  }

  revalidateTaskViews();
  return { ok: true, id: taskId };
}
