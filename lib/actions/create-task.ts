"use server";

import { canAssignRequests } from "@/lib/permissions";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidateTaskViews } from "@/lib/task-revalidate";
import { nextActionAtFromFormData } from "@/lib/date";

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

  for (const profile of profiles) {
    if (!profile.is_active) {
      return { ok: false, message: "Uno o più utenti selezionati non sono attivi." };
    }
    if (profile.team_id !== team_id) {
      return {
        ok: false,
        message: "Uno o più utenti non appartengono al team della task.",
      };
    }
  }

  const { data: taskRow, error: insertErr } = await supabase
    .from("tasks")
    .insert({
      team_id,
      created_by_user_id: me.userId,
      title,
      due_at,
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
