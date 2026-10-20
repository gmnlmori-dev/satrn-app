import { redirect } from "next/navigation";
import { AppChrome } from "@/components/app/app-chrome";
import { CurrentUserProvider } from "@/components/app/current-user-context";
import { isInboxEnabled } from "@/lib/app-settings";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import {
  getOldestUnreadActiveAnnouncementForUser,
  getUnreadAnnouncementCountForUser,
} from "@/lib/supabase/announcement-queries";
import {
  getCurrentProfileSummary,
  getMemberAvatarMap,
} from "@/lib/supabase/profile-queries";
import { getTeamTags } from "@/lib/supabase/tag-queries";
import { getTeamsForSelect } from "@/lib/supabase/team-queries";

/** Sessione/profilo via cookie: il segmento non è staticamente generabile in build. */
export const dynamic = "force-dynamic";

export default async function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, appSettings] = await Promise.all([
    getCurrentProfileSummary(),
    getAppSettings(),
  ]);
  if (profile && !profile.isActive) {
    redirect("/login?reason=inactive");
  }
  const inboxEnabled = isInboxEnabled(appSettings);
  const userId = profile?.userId;

  const [
    teamsForCreate,
    teamTags,
    memberAvatars,
    welcomeAnnouncement,
    unreadAnnouncementCount,
  ] = await Promise.all([
    profile?.role === "admin" ? getTeamsForSelect() : [],
    userId
      ? getTeamTags(
          profile.role === "admin" ? undefined : profile.teamId,
        ).catch(() => [])
      : [],
    userId ? getMemberAvatarMap().catch(() => ({})) : {},
    userId
      ? getOldestUnreadActiveAnnouncementForUser(userId).catch(() => null)
      : null,
    userId ? getUnreadAnnouncementCountForUser(userId).catch(() => 0) : 0,
  ]);

  return (
    <CurrentUserProvider
      profile={profile}
      teamsForCreate={teamsForCreate}
      inboxEnabled={inboxEnabled}
      teamTags={teamTags}
      memberAvatars={memberAvatars}
    >
      <AppChrome
        welcomeAnnouncement={welcomeAnnouncement}
        unreadAnnouncementCount={unreadAnnouncementCount}
      >
        {children}
      </AppChrome>
    </CurrentUserProvider>
  );
}
