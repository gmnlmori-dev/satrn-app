import type { AppAnnouncementRowWithRelations } from "@/types/database";
import type { AppAnnouncement } from "@/types/announcement";

function profileLabel(
  profile: { full_name: string; email: string } | null | undefined,
): string | null {
  if (!profile) return null;
  const name = profile.full_name?.trim();
  if (name) return name;
  const email = profile.email?.trim();
  return email || null;
}

export function isAnnouncementActive(
  startsAt: string | null,
  endsAt: string | null,
  now: Date = new Date(),
): boolean {
  const t = now.getTime();
  if (startsAt) {
    const start = new Date(startsAt).getTime();
    if (!Number.isNaN(start) && start > t) return false;
  }
  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (!Number.isNaN(end) && end <= t) return false;
  }
  return true;
}

export function announcementRowToAnnouncement(
  row: AppAnnouncementRowWithRelations,
  options?: { isRead?: boolean },
): AppAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    targetTeamId: row.target_team_id,
    targetTeamName: row.target_team?.name?.trim() || null,
    targetUserId: row.target_user_id,
    targetUserLabel: profileLabel(row.target_user),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActive: isAnnouncementActive(row.starts_at, row.ends_at),
    isRead: options?.isRead ?? false,
  };
}
