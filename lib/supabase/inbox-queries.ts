import { inboxItemRowToInboxItem } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InboxItemRowWithAssignee } from "@/types/database";
import type { InboxItem } from "@/types/inbox";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

export const INBOX_SELECT_WITH_ASSIGNEE = `
  *,
  assignee:profiles!inbox_items_assigned_user_id_fkey (
    user_id,
    full_name,
    email
  )
`;

/** Elenco inbox, più recenti per primi. */
export async function getInboxItems(): Promise<InboxItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select(INBOX_SELECT_WITH_ASSIGNEE)
    .order("created_at", { ascending: false });

  assertNoError("getInboxItems", error);
  return ((data ?? []) as InboxItemRowWithAssignee[]).map(inboxItemRowToInboxItem);
}

/** Dettaglio inbox per id, o `null` se assente. */
export async function getInboxItemById(id: string): Promise<InboxItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select(INBOX_SELECT_WITH_ASSIGNEE)
    .eq("id", id)
    .maybeSingle();

  assertNoError("getInboxItemById", error);
  if (!data) return null;
  return inboxItemRowToInboxItem(data as InboxItemRowWithAssignee);
}
