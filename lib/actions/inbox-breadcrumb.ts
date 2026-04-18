"use server";

import { getInboxItemById } from "@/lib/supabase/inbox-queries";

/** Oggetto per breadcrumb header (client). */
export async function fetchInboxSubjectForBreadcrumb(
  id: string,
): Promise<string | null> {
  const item = await getInboxItemById(id);
  return item?.subject ?? null;
}
