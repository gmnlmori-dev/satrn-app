import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/settings/admin-users-table";
import { canManageUsers } from "@/lib/permissions";
import {
  getCurrentProfileSummary,
  getProfilesForAdminList,
} from "@/lib/supabase/profile-queries";

export const metadata = {
  title: "Utenti",
};

export default async function AdminUsersSettingsPage() {
  const me = await getCurrentProfileSummary();
  if (!me || !canManageUsers(me.role)) {
    redirect("/app/dashboard");
  }

  const profiles = await getProfilesForAdminList();

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminUsersTable profiles={profiles} />
    </div>
  );
}
