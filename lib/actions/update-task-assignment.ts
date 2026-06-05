"use server";

import { canAssignRequests } from "@/lib/permissions";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidateTaskViews } from "@/lib/task-revalidate";
import type { TaskAssignee } from "@/types/task";

export type UpdateTaskAssignmentResult =
  | {
      ok: true;
      assignees: TaskAssignee[];
      assignedUserId: string | null;
      assignedAt: string | null;
      assignedToLabel: string | null;
    }
  | { ok: false; message: string };

function assigneeCaption(
  p: { full_name: string | null; email: string | null } | null,
): string {
  if (!p) return "Utente sconosciuto";
  const n = (p.full_name ?? "").trim();
  const e = (p.email ?? "").trim();
  if (n && e) return `${n} (${e})`;
  return n || e || "Utente sconosciuto";
}

type AssigneeProfile = {
  full_name: string | null;
  email: string | null;
};

type TaskAssigneeRow = {
  user_id: string;
  assigned_at: string;
  assignee?: AssigneeProfile | AssigneeProfile[] | null;
};

function nestedAssigneeProfile(
  value: AssigneeProfile | AssigneeProfile[] | null | undefined,
): AssigneeProfile | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapAssigneeRows(rows: unknown): TaskAssignee[] {
  return ((rows ?? []) as TaskAssigneeRow[])
    .map((row) => ({
      userId: row.user_id,
      label: assigneeCaption(nestedAssigneeProfile(row.assignee)),
      assignedAt: row.assigned_at,
    }))
    .sort(
      (a, b) =>
        new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
    );
}

function normalizeAssigneeIds(raw: string[]): string[] {
  return [...new Set(raw.map((id) => id.trim()).filter(Boolean))].sort();
}

function sameAssigneeSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

async function loadAssigneeProfiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userIds: string[],
  taskTeamId: string,
): Promise<
  | { ok: true; profiles: Map<string, AssigneeProfile> }
  | { ok: false; message: string }
> {
  if (userIds.length === 0) {
    return { ok: true, profiles: new Map() };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, is_active, team_id")
    .in("user_id", userIds);

  if (error) return { ok: false, message: error.message };

  const rows = (data ?? []) as {
    user_id: string;
    full_name: string | null;
    email: string | null;
    is_active: boolean;
    team_id: string;
  }[];

  if (rows.length !== userIds.length) {
    return { ok: false, message: "Uno o più destinatari non sono validi." };
  }

  for (const row of rows) {
    if (!row.is_active) {
      return { ok: false, message: "Uno o più utenti selezionati non sono attivi." };
    }
    if (row.team_id !== taskTeamId) {
      return {
        ok: false,
        message: "Uno o più utenti non appartengono al team della task.",
      };
    }
  }

  const profiles = new Map<string, AssigneeProfile>();
  for (const row of rows) {
    profiles.set(row.user_id, {
      full_name: row.full_name,
      email: row.email,
    });
  }

  return { ok: true, profiles };
}

export async function updateTaskAssignment(
  taskId: string,
  nextAssignedUserIds: string[],
): Promise<UpdateTaskAssignmentResult> {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive) {
    return { ok: false, message: "Sessione non valida." };
  }
  if (!canAssignRequests(me.role)) {
    return {
      ok: false,
      message: "Permesso negato: solo admin e manager possono assegnare.",
    };
  }

  const normNext = normalizeAssigneeIds(nextAssignedUserIds);
  const supabase = await createSupabaseServerClient();

  const { data: current, error: loadErr } = await supabase
    .from("tasks")
    .select("team_id")
    .eq("id", taskId)
    .maybeSingle();

  if (loadErr) return { ok: false, message: loadErr.message };
  if (!current) return { ok: false, message: "Task non trovata." };

  const taskTeamId = current.team_id as string;

  const { data: currentRows, error: currentRowsErr } = await supabase
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", taskId);

  if (currentRowsErr) return { ok: false, message: currentRowsErr.message };

  const beforeIds = normalizeAssigneeIds(
    ((currentRows ?? []) as { user_id: string }[]).map((row) => row.user_id),
  );

  if (sameAssigneeSet(beforeIds, normNext)) {
    const { data: unchangedRows } = await supabase
      .from("task_assignees")
      .select(
        `
        user_id,
        assigned_at,
        assignee:profiles!task_assignees_user_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq("task_id", taskId);

    const assignees = mapAssigneeRows(unchangedRows);
    const labels = assignees.map((a) => a.label).filter(Boolean);
    return {
      ok: true,
      assignees,
      assignedUserId: assignees[0]?.userId ?? null,
      assignedAt: assignees[0]?.assignedAt ?? null,
      assignedToLabel: labels.length > 0 ? labels.join(", ") : null,
    };
  }

  const profilesResult = await loadAssigneeProfiles(
    supabase,
    normNext,
    taskTeamId,
  );
  if (!profilesResult.ok) return profilesResult;

  const toRemove = beforeIds.filter((id) => !normNext.includes(id));
  const toAdd = normNext.filter((id) => !beforeIds.includes(id));
  const nowIso = new Date().toISOString();

  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .in("user_id", toRemove);
    if (delErr) return { ok: false, message: delErr.message };
  }

  if (toAdd.length > 0) {
    const { error: insErr } = await supabase.from("task_assignees").insert(
      toAdd.map((userId) => ({
        task_id: taskId,
        user_id: userId,
        assigned_at: nowIso,
        assigned_by_user_id: me.userId,
      })),
    );
    if (insErr) return { ok: false, message: insErr.message };
  }

  const { data: savedRows, error: savedErr } = await supabase
    .from("task_assignees")
    .select(
      `
      user_id,
      assigned_at,
      assignee:profiles!task_assignees_user_id_fkey (
        full_name,
        email
      )
    `,
    )
    .eq("task_id", taskId);

  if (savedErr) return { ok: false, message: savedErr.message };

  const assignees = mapAssigneeRows(savedRows);
  const labels = assignees.map((a) => a.label).filter(Boolean);

  revalidateTaskViews();
  return {
    ok: true,
    assignees,
    assignedUserId: assignees[0]?.userId ?? null,
    assignedAt: assignees[0]?.assignedAt ?? null,
    assignedToLabel: labels.length > 0 ? labels.join(", ") : null,
  };
}
