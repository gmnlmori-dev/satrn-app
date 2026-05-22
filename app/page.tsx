import { redirect } from "next/navigation";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { resolveDefaultHomePath } from "@/lib/user-preferences";

export default async function Home() {
  const profile = await getCurrentProfileSummary();
  redirect(resolveDefaultHomePath(profile?.preferences));
}
