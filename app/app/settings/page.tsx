import { AssignScopePreferencePanel } from "@/components/app/assign-scope-preference-panel";
import { CalendarPreferencePanel } from "@/components/app/calendar-preference-panel";
import { DefaultHomePagePreferencePanel } from "@/components/app/default-home-page-preference-panel";
import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import {
  resolveDefaultAssignScope,
  resolveDefaultHomePage,
  resolveDefaultRequestsCalendarLayout,
} from "@/lib/user-preferences";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";

export const metadata = {
  title: "Impostazioni",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfileSummary();
  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";
  const defaultCalendarLayout = profile
    ? resolveDefaultRequestsCalendarLayout(profile.preferences)
    : "month";
  const defaultHomePage = profile
    ? resolveDefaultHomePage(profile.preferences)
    : "dashboard";

  return (
    <div className="space-y-8 md:space-y-9">
      <ThemePreferencePanel />
      <DefaultHomePagePreferencePanel initialHomePage={defaultHomePage} />
      <AssignScopePreferencePanel initialScope={defaultScope} />
      <CalendarPreferencePanel initialCalendarLayout={defaultCalendarLayout} />
    </div>
  );
}
