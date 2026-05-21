import { AssignScopePreferencePanel } from "@/components/app/assign-scope-preference-panel";
import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6 md:space-y-7">
      <PageHeader
        title="Impostazioni"
        lead="Preferenze personali dell’interfaccia."
      />
      <AssignScopePreferencePanel initialScope={defaultScope} />
      <ThemePreferencePanel />
    </div>
  );
}
