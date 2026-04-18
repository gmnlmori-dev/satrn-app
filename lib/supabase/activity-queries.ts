import { requestActivityRowToActivity } from "@/lib/supabase/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RequestActivityRow } from "@/types/database";
import type { RequestActivity } from "@/types/activity";

function assertNoError(message: string, error: { message: string } | null) {
  if (error) throw new Error(`${message}: ${error.message}`);
}

/** Attività della richiesta, più recenti per prime. */
export async function getRequestActivities(
  requestId: string,
): Promise<RequestActivity[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("request_activities")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  assertNoError("getRequestActivities", error);
  return ((data ?? []) as RequestActivityRow[]).map(requestActivityRowToActivity);
}
