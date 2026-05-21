import { AppChrome } from "@/components/app/app-chrome";
import { CurrentUserProvider } from "@/components/app/current-user-context";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getTeamsForSelect } from "@/lib/supabase/team-queries";

/** Sessione/profilo via cookie: il segmento non è staticamente generabile in build. */
export const dynamic = "force-dynamic";

export default async function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfileSummary();
  const teamsForCreate =
    profile?.role === "admin" ? await getTeamsForSelect() : [];

  return (
    <CurrentUserProvider profile={profile} teamsForCreate={teamsForCreate}>
      <AppChrome>{children}</AppChrome>
    </CurrentUserProvider>
  );
}
