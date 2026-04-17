"use server";

import { getRequestById } from "@/lib/supabase/queries";

/** Titolo per breadcrumb header (client) senza duplicare la query nel layout. */
export async function fetchRequestTitleForBreadcrumb(
  id: string,
): Promise<string | null> {
  const r = await getRequestById(id);
  return r?.title ?? null;
}
