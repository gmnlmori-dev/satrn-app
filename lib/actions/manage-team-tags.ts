"use server";

import { revalidatePath } from "next/cache";
import { canManageTeamTags } from "@/lib/permissions";
import { parseTagColor } from "@/lib/tags";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TagColor } from "@/types/tag";

export type TagActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function revalidateTagSurfaces() {
  revalidatePath("/app/settings");
  revalidatePath("/app/requests");
  revalidatePath("/app/tasks");
  revalidatePath("/app/notes");
  revalidatePath("/app/follow-up");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
}

async function requireTagManager() {
  const me = await getCurrentProfileSummary();
  if (!me?.userId || !me.isActive || !me.teamId) {
    return { ok: false as const, message: "Sessione non valida.", me: null };
  }
  if (!canManageTeamTags(me.role)) {
    return {
      ok: false as const,
      message: "Solo manager o admin possono gestire i tag del team.",
      me: null,
    };
  }
  return { ok: true as const, me };
}

export async function createTeamTag(input: {
  name: string;
  color: TagColor;
  teamId?: string;
}): Promise<TagActionResult> {
  const gate = await requireTagManager();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  const name = input.name.trim();
  if (!name) return { ok: false, message: "Inserisci un nome per il tag." };
  if (name.length > 40) {
    return { ok: false, message: "Il nome del tag è troppo lungo (max 40)." };
  }

  const teamId =
    gate.me.role === "admin" && input.teamId
      ? input.teamId
      : gate.me.teamId;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_tags")
    .insert({
      team_id: teamId,
      name,
      color: parseTagColor(input.color),
      created_by_user_id: gate.me.userId,
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Esiste già un tag con questo nome." };
    }
    return { ok: false, message: error.message };
  }

  revalidateTagSurfaces();
  return { ok: true, id: data.id as string };
}

export async function updateTeamTag(input: {
  id: string;
  name: string;
  color: TagColor;
}): Promise<TagActionResult> {
  const gate = await requireTagManager();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  const name = input.name.trim();
  if (!name) return { ok: false, message: "Inserisci un nome per il tag." };
  if (name.length > 40) {
    return { ok: false, message: "Il nome del tag è troppo lungo (max 40)." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("team_tags")
    .update({
      name,
      color: parseTagColor(input.color),
    })
    .eq("id", input.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Esiste già un tag con questo nome." };
    }
    return { ok: false, message: error.message };
  }

  revalidateTagSurfaces();
  return { ok: true };
}

export async function deleteTeamTag(id: string): Promise<TagActionResult> {
  const gate = await requireTagManager();
  if (!gate.ok || !gate.me) return { ok: false, message: gate.message };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("team_tags").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidateTagSurfaces();
  return { ok: true };
}
