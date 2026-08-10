import { Suspense } from "react";
import { FollowUpAssigneeScope } from "@/components/follow-up/follow-up-assignee-scope";
import { FollowUpHashScroll } from "@/components/follow-up/follow-up-hash-scroll";
import { isInboxEnabled } from "@/lib/app-settings";
import { getAppSettings } from "@/lib/supabase/app-settings-queries";
import {
  getFollowUpChecklistEntries,
  getFollowUpRequestQueues,
  getInboxTriageItems,
} from "@/lib/supabase/follow-up-queries";
import {
  getOpenStandaloneTasks,
  getOverdueStandaloneTasks,
  getStandaloneTasksToday,
  getUpcomingStandaloneTasks,
} from "@/lib/supabase/task-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import {
  resolveDefaultAssignScope,
  resolveDefaultFollowUpTab,
} from "@/lib/user-preferences";
import { cn } from "@/lib/cn";
import { uiPageLead, uiPageTitle } from "@/lib/typography";

export const metadata = {
  title: "Da seguire",
};

export default async function FollowUpPage() {
  const [profile, appSettings] = await Promise.all([
    getCurrentProfileSummary(),
    getAppSettings(),
  ]);
  const inboxEnabled = isInboxEnabled(appSettings);

  const [
    requestQueues,
    inbox,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    allTasks,
    overdueChecklists,
    todayChecklists,
    upcomingChecklists,
  ] = await Promise.all([
    getFollowUpRequestQueues(),
    inboxEnabled ? getInboxTriageItems() : Promise.resolve([]),
    getOverdueStandaloneTasks(),
    getStandaloneTasksToday(),
    getUpcomingStandaloneTasks(),
    getOpenStandaloneTasks(),
    getFollowUpChecklistEntries("overdue"),
    getFollowUpChecklistEntries("today"),
    getFollowUpChecklistEntries("upcoming"),
  ]);

  const { overdue, today, upcoming, all } = requestQueues;

  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";
  const preferredFollowUpTab = profile
    ? resolveDefaultFollowUpTab(profile.preferences)
    : null;

  return (
    <div className="space-y-6 pb-12 md:space-y-8 md:pb-16">
      <FollowUpHashScroll />
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Da seguire</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          La tua coda operativa: scegli la finestra temporale e lavora progetti
          {inboxEnabled ? ", task e inbox" : " e task"} da un unico punto.
        </p>
      </header>
      <Suspense fallback={null}>
        <FollowUpAssigneeScope
          overdue={overdue}
          today={today}
          upcoming={upcoming}
          all={all}
          inbox={inbox}
          overdueTasks={overdueTasks}
          todayTasks={todayTasks}
          upcomingTasks={upcomingTasks}
          allTasks={allTasks}
          overdueChecklists={overdueChecklists}
          todayChecklists={todayChecklists}
          upcomingChecklists={upcomingChecklists}
          currentUserId={profile?.userId ?? ""}
          defaultScope={defaultScope}
          preferredFollowUpTab={preferredFollowUpTab}
          inboxEnabled={inboxEnabled}
        />
      </Suspense>
    </div>
  );
}
