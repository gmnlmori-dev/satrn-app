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
import type { DefaultFollowUpTabPreference } from "@/lib/user-preferences";
import type { Task } from "@/types/task";
import type { TeamTag } from "@/types/tag";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";
import { FollowUpView } from "@/components/follow-up/follow-up-view";
import { cn } from "@/lib/cn";
import { uiControl } from "@/lib/ui-classes";

type Props = {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  all: Request[];
  inbox: InboxItem[];
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  allTasks: Task[];
  overdueChecklists: CalendarTaskEntry[];
  todayChecklists: CalendarTaskEntry[];
  upcomingChecklists: CalendarTaskEntry[];
  checklistTagIdsByRequest?: Record<string, Record<string, string[]>>;
  teamTags?: TeamTag[];
  currentUserId: string;
  defaultScope: FollowUpAssigneeScope;
  preferredFollowUpTab?: DefaultFollowUpTabPreference | null;
  inboxEnabled?: boolean;
};

function filterByTagId<T extends { tagIds?: string[] }>(
  items: T[],
  tagId: string,
): T[] {
  if (tagId === "all") return items;
  return items.filter((item) => (item.tagIds ?? []).includes(tagId));
}

/**
 * Progetti: corrisponde se il tag è sul progetto oppure su una delle sue voci
 * checklist (così un tag messo solo su una voce non "sparisce" dal filtro).
 */
function filterRequestsByTag(
  requests: Request[],
  tagId: string,
  checklistTagIdsByRequest: Record<string, Record<string, string[]>>,
): Request[] {
  if (tagId === "all") return requests;
  return requests.filter((r) => {
    if (r.tagIds.includes(tagId)) return true;
    const byTask = checklistTagIdsByRequest[r.id];
    if (!byTask) return false;
    return Object.values(byTask).some((ids) => ids.includes(tagId));
  });
}

function filterChecklistsByTag(
  entries: CalendarTaskEntry[],
  tagId: string,
  checklistTagIdsByRequest: Record<string, Record<string, string[]>>,
): CalendarTaskEntry[] {
  if (tagId === "all") return entries;
  return entries.filter((entry) => {
    const ids =
      checklistTagIdsByRequest[entry.requestId]?.[entry.task.id] ?? [];
    return ids.includes(tagId);
  });
}

export function FollowUpAssigneeScope({
  overdue,
  today,
  upcoming,
  all,
  inbox,
  overdueTasks,
  todayTasks,
  upcomingTasks,
  allTasks,
  overdueChecklists,
  todayChecklists,
  upcomingChecklists,
  checklistTagIdsByRequest = {},
  teamTags = [],
  currentUserId,
  defaultScope,
  preferredFollowUpTab = null,
  inboxEnabled = false,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlScope = searchParams.get("scope");
  const [scope, setScope] = useState<FollowUpAssigneeScope>(() =>
    scopeFromSearchParam(urlScope, defaultScope),
  );
  const [tagId, setTagId] = useState("all");

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
    () =>
      filterRequestsByTag(
        mineOnly ? filterRequestsMine(overdue, currentUserId) : overdue,
        tagId,
        checklistTagIdsByRequest,
      ),
    [mineOnly, overdue, currentUserId, tagId, checklistTagIdsByRequest],
  );
  const filteredToday = useMemo(
    () =>
      filterRequestsByTag(
        mineOnly ? filterRequestsMine(today, currentUserId) : today,
        tagId,
        checklistTagIdsByRequest,
      ),
    [mineOnly, today, currentUserId, tagId, checklistTagIdsByRequest],
  );
  const filteredUpcoming = useMemo(
    () =>
      filterRequestsByTag(
        mineOnly ? filterRequestsMine(upcoming, currentUserId) : upcoming,
        tagId,
        checklistTagIdsByRequest,
      ),
    [mineOnly, upcoming, currentUserId, tagId, checklistTagIdsByRequest],
  );
  const filteredAll = useMemo(
    () =>
      filterRequestsByTag(
        mineOnly ? filterRequestsMine(all, currentUserId) : all,
        tagId,
        checklistTagIdsByRequest,
      ),
    [mineOnly, all, currentUserId, tagId, checklistTagIdsByRequest],
  );
  const filteredInbox = useMemo(
    () =>
      filterByTagId(
        mineOnly ? filterInboxMine(inbox, currentUserId) : inbox,
        tagId,
      ),
    [mineOnly, inbox, currentUserId, tagId],
  );
  const filteredOverdueTasks = useMemo(
    () =>
      filterByTagId(
        mineOnly ? filterTasksMine(overdueTasks, currentUserId) : overdueTasks,
        tagId,
      ),
    [mineOnly, overdueTasks, currentUserId, tagId],
  );
  const filteredTodayTasks = useMemo(
    () =>
      filterByTagId(
        mineOnly ? filterTasksMine(todayTasks, currentUserId) : todayTasks,
        tagId,
      ),
    [mineOnly, todayTasks, currentUserId, tagId],
  );
  const filteredUpcomingTasks = useMemo(
    () =>
      filterByTagId(
        mineOnly
          ? filterTasksMine(upcomingTasks, currentUserId)
          : upcomingTasks,
        tagId,
      ),
    [mineOnly, upcomingTasks, currentUserId, tagId],
  );
  const filteredAllTasks = useMemo(
    () =>
      filterByTagId(
        mineOnly ? filterTasksMine(allTasks, currentUserId) : allTasks,
        tagId,
      ),
    [mineOnly, allTasks, currentUserId, tagId],
  );
  const filteredOverdueChecklists = useMemo(
    () =>
      filterChecklistsByTag(
        mineOnly
          ? filterChecklistEntriesMine(overdueChecklists, currentUserId)
          : overdueChecklists,
        tagId,
        checklistTagIdsByRequest,
      ),
    [mineOnly, overdueChecklists, currentUserId, tagId, checklistTagIdsByRequest],
  );
  const filteredTodayChecklists = useMemo(
    () =>
      filterChecklistsByTag(
        mineOnly
          ? filterChecklistEntriesMine(todayChecklists, currentUserId)
          : todayChecklists,
        tagId,
        checklistTagIdsByRequest,
      ),
    [mineOnly, todayChecklists, currentUserId, tagId, checklistTagIdsByRequest],
  );
  const filteredUpcomingChecklists = useMemo(
    () =>
      filterChecklistsByTag(
        mineOnly
          ? filterChecklistEntriesMine(upcomingChecklists, currentUserId)
          : upcomingChecklists,
        tagId,
        checklistTagIdsByRequest,
      ),
    [
      mineOnly,
      upcomingChecklists,
      currentUserId,
      tagId,
      checklistTagIdsByRequest,
    ],
  );

  const scopeControl = (
    <div className="flex flex-wrap items-center gap-3">
      {showMine ? (
        <SegmentedControl
          ariaLabel="Ambito assegnazione"
          value={scope}
          options={[
            { value: "all", label: "Tutte" },
            { value: "mine", label: "Le mie" },
          ]}
          onChange={handleScopeChange}
        />
      ) : null}
      {teamTags.length > 0 ? (
        <label className="flex items-center gap-2 text-xs text-fg-tertiary">
          <span className="sr-only sm:not-sr-only">Tag</span>
          <select
            aria-label="Filtro tag"
            className={cn(
              uiControl,
              "w-auto min-w-[9rem] py-1.5 text-sm",
              tagId !== "all" && "border-accent/50",
            )}
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
          >
            <option value="all">Tutti i tag</option>
            {teamTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );

  return (
    <FollowUpView
      teamTags={teamTags}
      checklistTagIdsByRequest={checklistTagIdsByRequest}
      overdue={filteredOverdue}
      today={filteredToday}
      upcoming={filteredUpcoming}
      all={filteredAll}
      inbox={filteredInbox}
      overdueTasks={filteredOverdueTasks}
      todayTasks={filteredTodayTasks}
      upcomingTasks={filteredUpcomingTasks}
      allTasks={filteredAllTasks}
      overdueChecklists={filteredOverdueChecklists}
      todayChecklists={filteredTodayChecklists}
      upcomingChecklists={filteredUpcomingChecklists}
      scopeControl={scopeControl}
      preferredFollowUpTab={preferredFollowUpTab}
      inboxEnabled={inboxEnabled}
    />
  );
}
