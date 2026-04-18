"use server";

import { revalidatePath } from "next/cache";
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
  if (!raw_content) {
    return { ok: false, message: "Il contenuto grezzo è obbligatorio." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .insert({
      source,
      subject,
      sender_name,
      sender_email,
      raw_content,
      status: "new",
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

  revalidatePath("/app/inbox");
  revalidatePath("/app/follow-up");

  return { ok: true, id };
}
