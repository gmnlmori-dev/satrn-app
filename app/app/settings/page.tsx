import { ThemePreferencePanel } from "@/components/app/theme-preference-panel";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Impostazioni",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 md:space-y-7">
      <PageHeader
        title="Impostazioni"
        lead="Preferenze dell’interfaccia su questo dispositivo."
      />
      <ThemePreferencePanel />
    </div>
  );
}
