import { AssignScopePreferencePanel } from "@/components/app/assign-scope-preference-panel";
import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import { resolveDefaultAssignScope } from "@/lib/user-preferences";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";

export const metadata = {
  title: "Impostazioni",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfileSummary();
  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";

  return (
    <div className="mx-auto max-w-lg space-y-8 md:space-y-9">
      <ThemePreferencePanel />
      <AssignScopePreferencePanel initialScope={defaultScope} />
    </div>
  );
}
