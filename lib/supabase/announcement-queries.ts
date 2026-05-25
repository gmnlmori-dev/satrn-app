import {
  announcementRowToAnnouncement,
  isAnnouncementActive,
} from "@/lib/supabase/announcement-mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppAnnouncementRowWithRelations,
  AppAnnouncementReadRow,
} from "@/types/database";
import type { AppAnnouncement } from "@/types/announcement";

const ANNOUNCEMENT_SELECT = `
  *,
  target_team:teams!app_announcements_target_team_id_fkey ( id, name ),
  target_user:profiles!app_announcements_target_user_id_fkey (
    user_id,
    full_name,
    email
  ),
  creator:profiles!app_announcements_created_by_user_id_fkey (
    user_id,
    full_name,
    email
  )
`;

function assertNoError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function isMissingRelationError(error: { message: string; code?: string }) {
  return (
    error.code === "42P01" ||
    error.message.includes("app_announcements") ||
    error.message.includes("does not exist")
  );
}

async function getReadAnnouncementIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId);

  if (error) {
    if (isMissingRelationError(error)) return new Set();
    assertNoError("getReadAnnouncementIds", error);
  }

  return new Set(
    ((data ?? []) as Pick<AppAnnouncementReadRow, "announcement_id">[]).map(
      (row) => row.announcement_id,
    ),
  );
}

function mapRows(
  rows: AppAnnouncementRowWithRelations[],
  readIds: Set<string>,
): AppAnnouncement[] {
  return rows.map((row) =>
    announcementRowToAnnouncement(row, { isRead: readIds.has(row.id) }),
  );
}

/** Storico completo per admin. */
export async function getAnnouncementsForAdmin(): Promise<AppAnnouncement[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("created_at", { ascending: false });

  assertNoError("getAnnouncementsForAdmin", error);
  return mapRows((data ?? []) as AppAnnouncementRowWithRelations[], new Set());
}

/** Cronologia visibile all'utente (attive e scadute). */
export async function getVisibleAnnouncementsForUser(
  userId: string,
): Promise<AppAnnouncement[]> {
  if (!userId) return [];

  const supabase = await createSupabaseServerClient();
  const readIds = await getReadAnnouncementIds(userId);

  const { data, error } = await supabase
    .from("app_announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    assertNoError("getVisibleAnnouncementsForUser", error);
  }

  return mapRows((data ?? []) as AppAnnouncementRowWithRelations[], readIds);
}

/** Prima novità attiva non letta (FIFO per popup sequenziale). */
export async function getOldestUnreadActiveAnnouncementForUser(
  userId: string,
): Promise<AppAnnouncement | null> {
  const visible = await getVisibleAnnouncementsForUser(userId);
  const unreadActive = visible
    .filter((item) => !item.isRead && item.isActive)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  return unreadActive[0] ?? null;
}

/** Conteggio novità attive non lette (badge sidebar). */
export async function getUnreadAnnouncementCountForUser(
  userId: string,
): Promise<number> {
  const visible = await getVisibleAnnouncementsForUser(userId);
  return visible.filter((item) => !item.isRead && item.isActive).length;
}

export { isAnnouncementActive };
