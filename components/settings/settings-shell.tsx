import { SettingsNav } from "@/components/settings/settings-nav";
import { PageHeader } from "@/components/ui/page-header";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-7 md:space-y-8">
      <PageHeader
        title="Impostazioni"
        lead="Preferenze personali e gestione dell’organizzazione."
      />
      <SettingsNav />
      <div>{children}</div>
    </div>
  );
}
