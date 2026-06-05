import { Suspense } from "react";
import { FollowUpAssigneeScope } from "@/components/follow-up/follow-up-assignee-scope";
import { FollowUpHashScroll } from "@/components/follow-up/follow-up-hash-scroll";
import {
  getFollowUpTodayRequests,
  getInboxTriageItems,
  getOverdueRequests,
  getUpcomingRequests,
} from "@/lib/supabase/follow-up-queries";
import {
  getOverdueStandaloneTasks,
  getStandaloneTasksToday,
  getUpcomingStandaloneTasks,
} from "@/lib/supabase/task-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { resolveDefaultAssignScope } from "@/lib/user-preferences";
import { cn } from "@/lib/cn";
import { uiPageLead, uiPageTitle } from "@/lib/typography";

export const metadata = {
  title: "Da seguire",
};

export default async function FollowUpPage() {
  const profile = await getCurrentProfileSummary();
  const [overdue, today, upcoming, inbox, overdueTasks, todayTasks, upcomingTasks] =
    await Promise.all([
      getOverdueRequests(),
      getFollowUpTodayRequests(),
      getUpcomingRequests(),
      getInboxTriageItems(),
      getOverdueStandaloneTasks(),
      getStandaloneTasksToday(),
      getUpcomingStandaloneTasks(),
    ]);

  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";

  return (
    <div className="space-y-6 pb-12 md:space-y-8 md:pb-16">
      <FollowUpHashScroll />
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Da seguire</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          La tua coda operativa: scegli la finestra temporale e lavora richieste,
          task e inbox da un unico punto.
        </p>
      </header>
      <Suspense fallback={null}>
        <FollowUpAssigneeScope
          overdue={overdue}
          today={today}
          upcoming={upcoming}
          inbox={inbox}
          overdueTasks={overdueTasks}
          todayTasks={todayTasks}
          upcomingTasks={upcomingTasks}
          currentUserId={profile?.userId ?? ""}
          defaultScope={defaultScope}
        />
      </Suspense>
    </div>
  );
}
