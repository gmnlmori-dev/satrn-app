import { AnnouncementsWorkspace } from "@/components/announcements/announcements-workspace";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getVisibleAnnouncementsForUser } from "@/lib/supabase/announcement-queries";

export const metadata = {
  title: "Novità",
};

export default async function NovitaPage() {
  const profile = await getCurrentProfileSummary();
  const announcements = profile?.userId
    ? await getVisibleAnnouncementsForUser(profile.userId).catch(() => [])
    : [];

  return (
    <div className="space-y-6 pb-12 md:space-y-8 md:pb-16">
      <AnnouncementsWorkspace announcements={announcements} />
    </div>
  );
}
