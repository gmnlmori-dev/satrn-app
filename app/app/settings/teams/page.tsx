import { redirect } from "next/navigation";
import { AdminTeamsTable } from "@/components/settings/admin-teams-table";
import { canManageTeams } from "@/lib/permissions";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getTeamsForAdminList } from "@/lib/supabase/team-queries";

export const metadata = {
  title: "Team",
};

export default async function AdminTeamsSettingsPage() {
  const me = await getCurrentProfileSummary();
  if (!me || !canManageTeams(me.role)) {
    redirect("/app/dashboard");
  }

  const teams = await getTeamsForAdminList();

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminTeamsTable teams={teams} />
    </div>
  );
}
