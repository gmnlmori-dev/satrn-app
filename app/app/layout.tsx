import { AppChrome } from "@/components/app/app-chrome";
import { CurrentUserProvider } from "@/components/app/current-user-context";
import { isInboxEnabled } from "@/lib/app-settings";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import {
  getOldestUnreadActiveAnnouncementForUser,
  getUnreadAnnouncementCountForUser,
} from "@/lib/supabase/announcement-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getTeamsForSelect } from "@/lib/supabase/team-queries";

/** Sessione/profilo via cookie: il segmento non è staticamente generabile in build. */
export const dynamic = "force-dynamic";

export default async function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfileSummary();
  const appSettings = await getAppSettings();
  const inboxEnabled = isInboxEnabled(appSettings);
  const teamsForCreate =
    profile?.role === "admin" ? await getTeamsForSelect() : [];

  const [welcomeAnnouncement, unreadAnnouncementCount] = profile?.userId
    ? await Promise.all([
        getOldestUnreadActiveAnnouncementForUser(profile.userId).catch(
          () => null,
        ),
        getUnreadAnnouncementCountForUser(profile.userId).catch(() => 0),
      ])
    : [null, 0];

  return (
    <CurrentUserProvider
      profile={profile}
      teamsForCreate={teamsForCreate}
      inboxEnabled={inboxEnabled}
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
