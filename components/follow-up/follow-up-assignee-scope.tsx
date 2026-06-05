"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  filterInboxMine,
  filterRequestsMine,
  filterTasksMine,
  type FollowUpAssigneeScope,
} from "@/lib/request-assignee";
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
  currentUserId: string;
  defaultScope: FollowUpAssigneeScope;
};

function scopeFromSearchParam(
  raw: string | null,
  fallback: FollowUpAssigneeScope,
): FollowUpAssigneeScope {
  if (raw === "mine") return "mine";
  if (raw === "all") return "all";
  return fallback;
}

export function FollowUpAssigneeScope({
  overdue,
  today,
  upcoming,
  inbox,
  overdueTasks,
  todayTasks,
  upcomingTasks,
  currentUserId,
  defaultScope,
}: Props) {
  const searchParams = useSearchParams();
  const urlScope = searchParams.get("scope");
  const [scope, setScope] = useState<FollowUpAssigneeScope>(() =>
    scopeFromSearchParam(urlScope, defaultScope),
  );

  useEffect(() => {
    setScope(scopeFromSearchParam(urlScope, defaultScope));
  }, [urlScope, defaultScope]);

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

  const scopeControl = showMine ? (
    <SegmentedControl
      ariaLabel="Ambito assegnazione"
      value={scope}
      options={[
        { value: "all", label: "Tutte" },
        { value: "mine", label: "Le mie" },
      ]}
      onChange={setScope}
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
      scopeControl={scopeControl}
    />
  );
}
