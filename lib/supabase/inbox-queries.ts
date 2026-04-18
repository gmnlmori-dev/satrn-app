import { inboxItemRowToInboxItem } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InboxItemRow } from "@/types/database";
import type { InboxItem } from "@/types/inbox";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

/** Elenco inbox, più recenti per primi. */
export async function getInboxItems(): Promise<InboxItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .order("created_at", { ascending: false });

  assertNoError("getInboxItems", error);
  return ((data ?? []) as InboxItemRow[]).map(inboxItemRowToInboxItem);
}

/** Dettaglio inbox per id, o `null` se assente. */
export async function getInboxItemById(id: string): Promise<InboxItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError("getInboxItemById", error);
  if (!data) return null;
  return inboxItemRowToInboxItem(data as InboxItemRow);
}
