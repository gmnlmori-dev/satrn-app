"use server";

import { revalidatePath } from "next/cache";
import { canAssignRequests } from "@/lib/permissions";
import { insertRequestActivity } from "@/lib/request-activity-log";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateRequestAssignmentResult =
  | {
      ok: true;
      assignedUserId: string | null;
      assignedAt: string | null;
    }
  | { ok: false; message: string };

function assigneeCaption(
  p: {
    full_name: string | null;
    email: string | null;
  } | null,
): string {
  if (!p) return "Nessuno";
  const n = (p.full_name ?? "").trim();
  const e = (p.email ?? "").trim();
  if (n && e) return `${n} (${e})`;
  return n || e || "Utente sconosciuto";
}

/** Imposta / rimuove assegnazione (solo admin e manager). Registra timeline. */
export async function updateRequestAssignment(
  requestId: string,
  nextAssignedUserId: string | null,
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

  const supabase = await createSupabaseServerClient();

  const { data: current, error: loadErr } = await supabase
    .from("requests")
    .select("assigned_user_id, team_id")
    .eq("id", requestId)
    .maybeSingle();

  if (loadErr) return { ok: false, message: loadErr.message };
  if (!current) return { ok: false, message: "Richiesta non trovata." };

  const beforeId = current.assigned_user_id as string | null;
  const requestTeamId = current.team_id as string;
  const normNext = nextAssignedUserId === "" ? null : nextAssignedUserId;
  if (beforeId === normNext) {
    const { data: unchanged } = await supabase
      .from("requests")
      .select("assigned_user_id, assigned_at")
      .eq("id", requestId)
      .single();
    return {
      ok: true,
      assignedUserId:
        (unchanged?.assigned_user_id as string | null | undefined) ?? null,
      assignedAt: (unchanged?.assigned_at as string | null | undefined) ?? null,
    };
  }

  let targetProfile:
    | { full_name: string | null; email: string | null }
    | null = null;

  if (normNext) {
    const { data: tgt, error: tgtErr } = await supabase
      .from("profiles")
      .select("full_name, email, is_active, team_id")
      .eq("user_id", normNext)
      .maybeSingle();

    if (tgtErr || !tgt) {
      return { ok: false, message: "Destinatario assegnazione non trovato." };
    }
    if (!(tgt as { is_active: boolean }).is_active) {
      return { ok: false, message: "L’utente selezionato non è attivo." };
    }
    if ((tgt as { team_id: string }).team_id !== requestTeamId) {
      return {
        ok: false,
        message: "L’utente selezionato non appartiene al team della richiesta.",
      };
    }
    targetProfile = {
      full_name: (tgt as { full_name: string }).full_name ?? null,
      email: (tgt as { email: string }).email ?? null,
    };
  }

  let beforeProfile:
    | { full_name: string | null; email: string | null }
    | null = null;

  if (beforeId) {
    const { data: b } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", beforeId)
      .maybeSingle();
    if (b) {
      beforeProfile = {
        full_name: (b as { full_name: string }).full_name ?? null,
        email: (b as { email: string }).email ?? null,
      };
    }
  }

  const nowIso = new Date().toISOString();
  const payload = {
    assigned_user_id: normNext,
    assigned_at: normNext ? nowIso : null,
    last_interaction_at: nowIso,
  };

  const { data: saved, error: upErr } = await supabase
    .from("requests")
    .update(payload)
    .eq("id", requestId)
    .select("assigned_user_id, assigned_at")
    .single();

  if (upErr) return { ok: false, message: upErr.message };

  const fromLabel = assigneeCaption(beforeProfile);
  const toLabel = assigneeCaption(targetProfile);
  const body = `Assegnazione: ${fromLabel} → ${toLabel}`;

  await insertRequestActivity(supabase, {
    requestId,
    type: "assigned_user_changed",
    body,
    meta: {
      from_assigned_user_id: beforeId,
      to_assigned_user_id: normNext,
      changed_by_user_id: me.userId,
    },
  });

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/dashboard");
  revalidatePath("/app/follow-up");

  return {
    ok: true,
    assignedUserId: (saved?.assigned_user_id as string | null) ?? null,
    assignedAt: (saved?.assigned_at as string | null) ?? null,
  };
}
