import { redirect } from "next/navigation";

export const metadata = {
  title: "Nuovo inbox",
};

export default async function InboxNewPage() {
  const { isInboxEnabledServer } = await import(
    "@/lib/supabase/app-settings-queries"
  );
  if (!(await isInboxEnabledServer())) {
    redirect("/app/dashboard");
  }
  redirect("/app/inbox?nuova=1");
}
