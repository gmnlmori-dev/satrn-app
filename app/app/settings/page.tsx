import { AssignScopePreferencePanel } from "@/components/app/assign-scope-preference-panel";
import { CalendarPreferencePanel } from "@/components/app/calendar-preference-panel";
import { DefaultHomePagePreferencePanel } from "@/components/app/default-home-page-preference-panel";
import { FollowUpTabPreferencePanel } from "@/components/app/follow-up-tab-preference-panel";
import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import { TeamTagsSettingsPanel } from "@/components/settings/team-tags-settings-panel";
import { isInboxEnabled } from "@/lib/app-settings";
import { canManageTeamTags } from "@/lib/permissions";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import {
  resolveDefaultAssignScope,
  resolveDefaultFollowUpTab,
  resolveDefaultHomePage,
  resolveDefaultRequestsCalendarLayout,
} from "@/lib/user-preferences";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getTeamTags } from "@/lib/supabase/tag-queries";

export const metadata = {
  title: "Impostazioni",
};

export default async function SettingsPage() {
  const [profile, appSettings] = await Promise.all([
    getCurrentProfileSummary(),
    getAppSettings(),
  ]);
  const inboxEnabled = isInboxEnabled(appSettings);
  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";
  const defaultCalendarLayout = profile
    ? resolveDefaultRequestsCalendarLayout(profile.preferences)
    : "month";
  const defaultHomePage = profile
    ? resolveDefaultHomePage(profile.preferences)
    : "dashboard";
  const defaultFollowUpTab =
    (profile ? resolveDefaultFollowUpTab(profile.preferences) : null) ??
    "today";

  const canManageTags = profile ? canManageTeamTags(profile.role) : false;
  const teamTags = canManageTags
    ? await getTeamTags(profile?.role === "admin" ? undefined : profile?.teamId)
    : [];
  const settingsTags =
    profile && canManageTags
      ? profile.role === "admin"
        ? teamTags.filter((t) => t.teamId === profile.teamId)
        : teamTags
      : [];

  return (
    <div className="space-y-8 md:space-y-9">
      <ThemePreferencePanel />
      <DefaultHomePagePreferencePanel initialHomePage={defaultHomePage} />
      <FollowUpTabPreferencePanel initialTab={defaultFollowUpTab} />
      <AssignScopePreferencePanel
        initialScope={defaultScope}
        inboxEnabled={inboxEnabled}
      />
      <CalendarPreferencePanel initialCalendarLayout={defaultCalendarLayout} />
      {canManageTags && profile?.teamId ? (
        <TeamTagsSettingsPanel
          initialTags={settingsTags}
          teamId={profile.teamId}
        />
      ) : null}
    </div>
  );
}
