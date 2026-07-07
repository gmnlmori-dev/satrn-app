import { redirect } from "next/navigation";
import { AdminInboxTogglePanel } from "@/components/settings/admin-inbox-toggle-panel";
import { AdminUsersTable } from "@/components/settings/admin-users-table";
import { canManageUsers } from "@/lib/permissions";
import { isInboxEnabled } from "@/lib/app-settings";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import {
  getCurrentProfileSummary,
  getProfilesForAdminList,
} from "@/lib/supabase/profile-queries";
import { getTeamsForSelect } from "@/lib/supabase/team-queries";

export const metadata = {
  title: "Utenti",
};

export default async function AdminUsersSettingsPage() {
  const me = await getCurrentProfileSummary();
  if (!me || !canManageUsers(me.role)) {
    redirect("/app/dashboard");
  }

  const [profiles, teams, appSettings] = await Promise.all([
    getProfilesForAdminList(),
    getTeamsForSelect(),
    getAppSettings(),
  ]);

  return (
    <div className="space-y-8 md:space-y-9">
      <AdminInboxTogglePanel initialEnabled={isInboxEnabled(appSettings)} />
      <AdminUsersTable profiles={profiles} teams={teams} />
    </div>
  );
}
