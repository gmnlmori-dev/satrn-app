import { Suspense } from "react";
import { RequestsWorkspace } from "@/components/requests/requests-workspace";
import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import { getRequests } from "@/lib/supabase/queries";
import {
  defaultAssignScopeToFilter,
  resolveDefaultAssignScope,
} from "@/lib/user-preferences";

export const metadata = {
  title: "Richieste",
};

export default async function RequestsPage() {
  const [requests, profile] = await Promise.all([
    getRequests(),
    getCurrentProfileSummary(),
  ]);
  const assignees = await getActiveAssigneeOptions(profile?.teamId ?? "");
  const defaultAssignScope = profile
    ? defaultAssignScopeToFilter(
        resolveDefaultAssignScope(profile.preferences, profile.role),
      )
    : "all";

  return (
    <Suspense fallback={null}>
      <RequestsWorkspace
        requests={requests}
        currentUserId={profile?.userId ?? ""}
        assigneeOptions={assignees}
        defaultAssignScope={defaultAssignScope}
      />
    </Suspense>
  );
}
