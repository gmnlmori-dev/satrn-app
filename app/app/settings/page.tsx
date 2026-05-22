import { AssignScopePreferencePanel } from "@/components/app/assign-scope-preference-panel";
import { DefaultHomePagePreferencePanel } from "@/components/app/default-home-page-preference-panel";
import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import {
  resolveDefaultAssignScope,
  resolveDefaultHomePage,
  resolveDefaultRequestsCalendarLayout,
  resolveDefaultRequestsView,
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
  const defaultView = profile
    ? resolveDefaultRequestsView(profile.preferences)
    : "list";
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
      <AssignScopePreferencePanel
        initialScope={defaultScope}
        initialView={defaultView}
        initialCalendarLayout={defaultCalendarLayout}
      />
    </div>
  );
}

