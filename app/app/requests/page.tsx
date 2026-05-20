import { RequestsWorkspace } from "@/components/requests/requests-workspace";
import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import { getRequests } from "@/lib/supabase/queries";

export const metadata = {
  title: "Richieste",
};

export default async function RequestsPage() {
  const [requests, profile, assignees] = await Promise.all([
    getRequests(),
    getCurrentProfileSummary(),
    getActiveAssigneeOptions(),
  ]);
  return (
    <RequestsWorkspace
      requests={requests}
      currentUserId={profile?.userId ?? ""}
      assigneeOptions={assignees}
    />
  );
}
