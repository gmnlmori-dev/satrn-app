import { AssignScopePreferencePanel } from "@/components/app/assign-scope-preference-panel";
import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import {
  resolveDefaultAssignScope,
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

  return (
    <div className="space-y-8 md:space-y-9">
      <ThemePreferencePanel />
      <AssignScopePreferencePanel
        initialScope={defaultScope}
        initialView={defaultView}
        initialCalendarLayout={defaultCalendarLayout}
      />
    </div>
  );
}

