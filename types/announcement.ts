export type AnnouncementAudience = "all" | "team" | "user";

export type AppAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  targetTeamId: string | null;
  targetTeamName: string | null;
  targetUserId: string | null;
  targetUserLabel: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isRead: boolean;
};
