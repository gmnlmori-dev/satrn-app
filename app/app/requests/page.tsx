import { RequestsWorkspace } from "@/components/requests/requests-workspace";
import { getRequests } from "@/lib/supabase/queries";

export const metadata = {
  title: "Richieste",
};

export default async function RequestsPage() {
  const requests = await getRequests();
  return <RequestsWorkspace requests={requests} />;
}
