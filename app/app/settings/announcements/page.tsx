import { redirect } from "next/navigation";
import { AdminAnnouncementsTable } from "@/components/settings/admin-announcements-table";
import { canManageUsers } from "@/lib/permissions";
import { getAnnouncementsForAdmin } from "@/lib/supabase/announcement-queries";
import {
  getCurrentProfileSummary,
  getProfilesForAdminList,
} from "@/lib/supabase/profile-queries";
import { getTeamsForSelect } from "@/lib/supabase/team-queries";

export const metadata = {
  title: "Novità",
};

export default async function AdminAnnouncementsSettingsPage() {
  const me = await getCurrentProfileSummary();
  if (!me || !canManageUsers(me.role)) {
    redirect("/app/dashboard");
  }

  const [announcements, teams, profiles] = await Promise.all([
    getAnnouncementsForAdmin().catch(() => []),
    getTeamsForSelect(),
    getProfilesForAdminList(),
  ]);

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminAnnouncementsTable
        announcements={announcements}
        teams={teams}
        profiles={profiles}
      />
    </div>
  );
}
