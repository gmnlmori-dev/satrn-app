"use server";

import {
  assigneeCaption,
  loadAssigneeProfiles,
  nestedAssigneeProfile,
  normalizeAssigneeIds,
  sameAssigneeSet,
  type AssigneeProfile,
} from "@/lib/assignee-actions";
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

type TaskAssigneeRow = {
  user_id: string;
  assigned_at: string;
  assignee?: AssigneeProfile | AssigneeProfile[] | null;
};

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
    me.role,
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
