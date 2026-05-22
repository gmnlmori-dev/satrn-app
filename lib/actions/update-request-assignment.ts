"use server";

import { revalidatePath } from "next/cache";
import { formatAssigneeList } from "@/lib/request-assignees";
import { canAssignRequests } from "@/lib/permissions";
import { insertRequestActivity } from "@/lib/request-activity-log";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RequestAssignee } from "@/types/request";

export type UpdateRequestAssignmentResult =
  | {
      ok: true;
      assignees: RequestAssignee[];
      assignedUserId: string | null;
      assignedAt: string | null;
      assignedToLabel: string | null;
    }
  | { ok: false; message: string };

function assigneeCaption(
  p: {
    full_name: string | null;
    email: string | null;
  } | null,
): string {
  if (!p) return "Utente sconosciuto";
  const n = (p.full_name ?? "").trim();
  const e = (p.email ?? "").trim();
  if (n && e) return `${n} (${e})`;
  return n || e || "Utente sconosciuto";
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
  requestTeamId: string,
): Promise<
  | { ok: true; profiles: Map<string, { full_name: string | null; email: string | null }> }
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
    if (row.team_id !== requestTeamId) {
      return {
        ok: false,
        message: "Uno o più utenti non appartengono al team della richiesta.",
      };
    }
  }

  const profiles = new Map<
    string,
    { full_name: string | null; email: string | null }
  >();
  for (const row of rows) {
    profiles.set(row.user_id, {
      full_name: row.full_name,
      email: row.email,
    });
  }

  return { ok: true, profiles };
}

/** Imposta gli assegnatari (solo admin e manager). Registra timeline. */
export async function updateRequestAssignment(
  requestId: string,
  nextAssignedUserIds: string[],
): Promise<UpdateRequestAssignmentResult> {
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
    .from("requests")
    .select("team_id")
    .eq("id", requestId)
    .maybeSingle();

  if (loadErr) return { ok: false, message: loadErr.message };
  if (!current) return { ok: false, message: "Richiesta non trovata." };

  const requestTeamId = current.team_id as string;

  const { data: currentRows, error: currentRowsErr } = await supabase
    .from("request_assignees")
    .select("user_id, assigned_at")
    .eq("request_id", requestId);

  if (currentRowsErr) return { ok: false, message: currentRowsErr.message };

  const beforeIds = normalizeAssigneeIds(
    ((currentRows ?? []) as { user_id: string }[]).map((row) => row.user_id),
  );

  if (sameAssigneeSet(beforeIds, normNext)) {
    const { data: unchangedRows } = await supabase
      .from("request_assignees")
      .select(
        `
        user_id,
        assigned_at,
        assignee:profiles!request_assignees_user_id_fkey (
          full_name,
          email
        )
      `,
      )
      .eq("request_id", requestId);

    const assignees = ((unchangedRows ?? []) as {
      user_id: string;
      assigned_at: string;
      assignee: { full_name: string | null; email: string | null } | null;
    }[])
      .map((row) => ({
        userId: row.user_id,
        label: assigneeCaption(row.assignee),
        assignedAt: row.assigned_at,
      }))
      .sort(
        (a, b) =>
          new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
      );

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
    requestTeamId,
  );
  if (!profilesResult.ok) return profilesResult;

  const beforeProfilesResult = await loadAssigneeProfiles(
    supabase,
    beforeIds,
    requestTeamId,
  );
  if (!beforeProfilesResult.ok) return beforeProfilesResult;

  const toRemove = beforeIds.filter((id) => !normNext.includes(id));
  const toAdd = normNext.filter((id) => !beforeIds.includes(id));
  const nowIso = new Date().toISOString();

  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from("request_assignees")
      .delete()
      .eq("request_id", requestId)
      .in("user_id", toRemove);
    if (delErr) return { ok: false, message: delErr.message };
  }

  if (toAdd.length > 0) {
    const { error: insErr } = await supabase.from("request_assignees").insert(
      toAdd.map((userId) => ({
        request_id: requestId,
        user_id: userId,
        assigned_at: nowIso,
        assigned_by_user_id: me.userId,
      })),
    );
    if (insErr) return { ok: false, message: insErr.message };
  }

  const primaryAssigneeId = normNext[0] ?? null;
  const { error: upErr } = await supabase
    .from("requests")
    .update({
      assigned_user_id: primaryAssigneeId,
      assigned_at: primaryAssigneeId ? nowIso : null,
      last_interaction_at: nowIso,
    })
    .eq("id", requestId);

  if (upErr) return { ok: false, message: upErr.message };

  const { data: savedRows, error: savedErr } = await supabase
    .from("request_assignees")
    .select(
      `
      user_id,
      assigned_at,
      assignee:profiles!request_assignees_user_id_fkey (
        full_name,
        email
      )
    `,
    )
    .eq("request_id", requestId);

  if (savedErr) return { ok: false, message: savedErr.message };

  const assignees = ((savedRows ?? []) as {
    user_id: string;
    assigned_at: string;
    assignee: { full_name: string | null; email: string | null } | null;
  }[])
    .map((row) => ({
      userId: row.user_id,
      label: assigneeCaption(row.assignee),
      assignedAt: row.assigned_at,
    }))
    .sort(
      (a, b) =>
        new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime(),
    );

  const fromLabels = beforeIds.map((id) =>
    assigneeCaption(beforeProfilesResult.profiles.get(id) ?? null),
  );
  const toLabels = normNext.map((id) =>
    assigneeCaption(profilesResult.profiles.get(id) ?? null),
  );

  const body = `Assegnazione: ${formatAssigneeList(
    fromLabels.map((label) => ({ label })),
  )} → ${formatAssigneeList(toLabels.map((label) => ({ label })))}`;

  await insertRequestActivity(supabase, {
    requestId,
    type: "assigned_user_changed",
    body,
    meta: {
      from_assigned_user_id: beforeIds[0] ?? null,
      to_assigned_user_id: normNext[0] ?? null,
      from_assigned_user_ids: beforeIds,
      to_assigned_user_ids: normNext,
      changed_by_user_id: me.userId,
    },
  });

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");

  const labels = assignees.map((a) => a.label).filter(Boolean);
  return {
    ok: true,
    assignees,
    assignedUserId: assignees[0]?.userId ?? null,
    assignedAt: assignees[0]?.assignedAt ?? null,
    assignedToLabel: labels.length > 0 ? labels.join(", ") : null,
  };
}
