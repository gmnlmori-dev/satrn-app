import { Suspense } from "react";
import { CalendarWorkspace } from "@/components/requests/calendar-workspace";
import {
  getActiveAssigneeOptions,
  getCurrentProfileSummary,
} from "@/lib/supabase/profile-queries";
import { getRequests } from "@/lib/supabase/queries";
import { getTasks } from "@/lib/supabase/task-queries";
import {
  defaultAssignScopeToFilter,
  resolveDefaultAssignScope,
  resolveDefaultRequestsCalendarLayout,
} from "@/lib/user-preferences";

export const metadata = {
  title: "Calendario",
};

export default async function CalendarPage() {
  const [requests, tasks, profile] = await Promise.all([
    getRequests(),
    getTasks(),
    getCurrentProfileSummary(),
  ]);
  const assignees = await getActiveAssigneeOptions(profile?.teamId ?? "");
  const defaultAssignScope = profile
    ? defaultAssignScopeToFilter(
        resolveDefaultAssignScope(profile.preferences, profile.role),
      )
    : "all";
  const defaultCalendarLayout = profile
    ? resolveDefaultRequestsCalendarLayout(profile.preferences)
    : "month";

  return (
    <Suspense fallback={null}>
      <CalendarWorkspace
        requests={requests}
        tasks={tasks}
        currentUserId={profile?.userId ?? ""}
        currentUserRole={profile?.role ?? "operator"}
        assigneeOptions={assignees}
        defaultAssignScope={defaultAssignScope}
        defaultCalendarLayout={defaultCalendarLayout}
      />
    </Suspense>
  );
}
