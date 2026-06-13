"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  persistAssigneeScopeInUrl,
  scopeFromSearchParam,
} from "@/lib/assignee-scope-url";
import {
  filterChecklistEntriesMine,
  filterInboxMine,
  filterRequestsMine,
  filterTasksMine,
  type FollowUpAssigneeScope,
} from "@/lib/request-assignee";
import type { CalendarTaskEntry } from "@/lib/next-action-tasks";
import type { Task } from "@/types/task";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";
import { FollowUpView } from "@/components/follow-up/follow-up-view";

type Props = {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  inbox: InboxItem[];
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  overdueChecklists: CalendarTaskEntry[];
  todayChecklists: CalendarTaskEntry[];
  upcomingChecklists: CalendarTaskEntry[];
  currentUserId: string;
  defaultScope: FollowUpAssigneeScope;
};

export function FollowUpAssigneeScope({
  overdue,
  today,
  upcoming,
  inbox,
  overdueTasks,
  todayTasks,
  upcomingTasks,
  overdueChecklists,
  todayChecklists,
  upcomingChecklists,
  currentUserId,
  defaultScope,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlScope = searchParams.get("scope");
  const [scope, setScope] = useState<FollowUpAssigneeScope>(() =>
    scopeFromSearchParam(urlScope, defaultScope),
  );

  useEffect(() => {
    setScope(scopeFromSearchParam(urlScope, defaultScope));
  }, [urlScope, defaultScope]);

  function handleScopeChange(next: FollowUpAssigneeScope) {
    setScope(next);
    persistAssigneeScopeInUrl(next, pathname, searchParams);
  }

  const showMine = Boolean(currentUserId);
  const mineOnly = scope === "mine" && showMine;

  const filteredOverdue = useMemo(
    () => (mineOnly ? filterRequestsMine(overdue, currentUserId) : overdue),
    [mineOnly, overdue, currentUserId],
  );
  const filteredToday = useMemo(
    () => (mineOnly ? filterRequestsMine(today, currentUserId) : today),
    [mineOnly, today, currentUserId],
  );
  const filteredUpcoming = useMemo(
    () => (mineOnly ? filterRequestsMine(upcoming, currentUserId) : upcoming),
    [mineOnly, upcoming, currentUserId],
  );
  const filteredInbox = useMemo(
    () => (mineOnly ? filterInboxMine(inbox, currentUserId) : inbox),
    [mineOnly, inbox, currentUserId],
  );
  const filteredOverdueTasks = useMemo(
    () => (mineOnly ? filterTasksMine(overdueTasks, currentUserId) : overdueTasks),
    [mineOnly, overdueTasks, currentUserId],
  );
  const filteredTodayTasks = useMemo(
    () => (mineOnly ? filterTasksMine(todayTasks, currentUserId) : todayTasks),
    [mineOnly, todayTasks, currentUserId],
  );
  const filteredUpcomingTasks = useMemo(
    () =>
      mineOnly ? filterTasksMine(upcomingTasks, currentUserId) : upcomingTasks,
    [mineOnly, upcomingTasks, currentUserId],
  );
  const filteredOverdueChecklists = useMemo(
    () =>
      mineOnly
        ? filterChecklistEntriesMine(overdueChecklists, currentUserId)
        : overdueChecklists,
    [mineOnly, overdueChecklists, currentUserId],
  );
  const filteredTodayChecklists = useMemo(
    () =>
      mineOnly
        ? filterChecklistEntriesMine(todayChecklists, currentUserId)
        : todayChecklists,
    [mineOnly, todayChecklists, currentUserId],
  );
  const filteredUpcomingChecklists = useMemo(
    () =>
      mineOnly
        ? filterChecklistEntriesMine(upcomingChecklists, currentUserId)
        : upcomingChecklists,
    [mineOnly, upcomingChecklists, currentUserId],
  );

  const scopeControl = showMine ? (
    <SegmentedControl
      ariaLabel="Ambito assegnazione"
      value={scope}
      options={[
        { value: "all", label: "Tutte" },
        { value: "mine", label: "Le mie" },
      ]}
      onChange={handleScopeChange}
    />
  ) : null;

  return (
    <FollowUpView
      overdue={filteredOverdue}
      today={filteredToday}
      upcoming={filteredUpcoming}
      inbox={filteredInbox}
      overdueTasks={filteredOverdueTasks}
      todayTasks={filteredTodayTasks}
      upcomingTasks={filteredUpcomingTasks}
      overdueChecklists={filteredOverdueChecklists}
      todayChecklists={filteredTodayChecklists}
      upcomingChecklists={filteredUpcomingChecklists}
      scopeControl={scopeControl}
    />
  );
}
