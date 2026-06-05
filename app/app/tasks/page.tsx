import { Suspense } from "react";
import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { getTasks } from "@/lib/supabase/task-queries";
import { getActiveAssigneeOptions, getCurrentProfileSummary } from "@/lib/supabase/profile-queries";

export const metadata = {
  title: "Task",
};

export default async function TasksPage() {
  const [tasks, profile] = await Promise.all([
    getTasks(),
    getCurrentProfileSummary(),
  ]);
  const assignees = await getActiveAssigneeOptions(profile?.teamId ?? "");

  return (
    <Suspense fallback={null}>
      <TasksWorkspace
        tasks={tasks}
        currentUserId={profile?.userId ?? ""}
        currentUserRole={profile?.role ?? "operator"}
        assigneeOptions={assignees}
        preferences={profile?.preferences}
      />
    </Suspense>
  );
}
