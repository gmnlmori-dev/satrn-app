import { Suspense } from "react";
import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { getTasks } from "@/lib/supabase/task-queries";
import { getActiveAssigneeOptions, getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { getTeamTags } from "@/lib/supabase/tag-queries";

export const metadata = {
  title: "Task",
};

export default async function TasksPage() {
  const [tasks, profile] = await Promise.all([
    getTasks(),
    getCurrentProfileSummary(),
  ]);
  const [assignees, teamTags] = await Promise.all([
    getActiveAssigneeOptions(profile?.teamId ?? ""),
    getTeamTags(profile?.role === "admin" ? undefined : profile?.teamId),
  ]);

  return (
    <Suspense fallback={null}>
      <TasksWorkspace
        tasks={tasks}
        currentUserId={profile?.userId ?? ""}
        currentUserRole={profile?.role ?? "operator"}
        assigneeOptions={assignees}
        teamTags={teamTags}
        preferences={profile?.preferences}
      />
    </Suspense>
  );
}
