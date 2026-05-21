import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/settings/admin-users-table";
import { canManageUsers } from "@/lib/permissions";
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

  const [profiles, teams] = await Promise.all([
    getProfilesForAdminList(),
    getTeamsForSelect(),
  ]);

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminUsersTable profiles={profiles} teams={teams} />
    </div>
  );
}
