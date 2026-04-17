"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Request } from "@/types/request";

export type UpdateRequestDetailsPatch = Pick<
  Request,
  | "title"
  | "companyName"
  | "contactName"
  | "contactEmail"
  | "source"
  | "description"
>;

export type UpdateRequestDetailsResult =
  | { ok: true; updatedAt: string }
  | { ok: false; message: string };

export async function updateRequestDetails(
  id: string,
  patch: UpdateRequestDetailsPatch,
): Promise<UpdateRequestDetailsResult> {
  const now = new Date().toISOString();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("requests")
    .update({
      title: patch.title.trim(),
      company_name: patch.companyName.trim(),
      contact_name: patch.contactName.trim(),
      contact_email: patch.contactEmail.trim(),
      source: patch.source.trim(),
      description: patch.description.trim(),
      updated_at: now,
    })
    .eq("id", id)
    .select("updated_at")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Aggiornamento non riuscito.",
    };
  }

  const row = data as { updated_at: string };

  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${id}`);
  revalidatePath("/app/dashboard");

  return { ok: true, updatedAt: row.updated_at };
}
