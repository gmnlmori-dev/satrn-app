import { AppChrome } from "@/components/app/app-chrome";
import { CurrentUserProvider } from "@/components/app/current-user-context";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";

export default async function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfileSummary();
  return (
    <CurrentUserProvider profile={profile}>
      <AppChrome>{children}</AppChrome>
    </CurrentUserProvider>
  );
}
