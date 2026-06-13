"use server";

import { revalidateInboxViews } from "@/lib/request-revalidate";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateInboxItemResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createInboxItem(
  fd: FormData,
): Promise<CreateInboxItemResult> {
  const source = String(fd.get("source") ?? "").trim();
  const subject = String(fd.get("subject") ?? "").trim();
  const sender_name = String(fd.get("senderName") ?? "").trim();
  const sender_email = String(fd.get("senderEmail") ?? "").trim();
  const raw_content = String(fd.get("rawContent") ?? "").trim();

  if (!subject) {
    return { ok: false, message: "Il titolo (oggetto) è obbligatorio." };
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

  const supabase = await createSupabaseServerClient();
  const assignedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("inbox_items")
    .insert({
      source,
      subject,
      sender_name,
      sender_email,
      raw_content,
      status: "new",
      team_id,
      assigned_user_id: me.userId,
      assigned_at: assignedAt,
      created_by_user_id: me.userId,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }
  const id = data?.id;
  if (!id || typeof id !== "string") {
    return {
      ok: false,
      message: "Nessun identificativo restituito dal database.",
    };
  }

  revalidateInboxViews();

  return { ok: true, id };
}
