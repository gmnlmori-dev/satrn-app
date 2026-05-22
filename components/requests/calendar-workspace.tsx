"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Request } from "@/types/request";
import type { AppRole, AssigneeOption } from "@/types/profile";
import { canViewAllTeamsRequestMeta } from "@/lib/permissions";
import {
  RequestsDatabaseEmptyState,
  RequestsEmptyState,
} from "@/components/requests/requests-empty-state";
import { RequestsCalendar } from "@/components/requests/requests-calendar";
import { RequestsToolbar } from "@/components/requests/requests-toolbar";
import { cn } from "@/lib/cn";
import { monthParamFromDate } from "@/lib/date";
import {
  countByStatus,
  countDueToday,
  countOpenRequests,
} from "@/lib/requests-overview";
import {
  collectSources,
  defaultToolbarFilters,
  filterByToolbar,
  type SortOption,
  type ToolbarFilters,
  type AssignScopeFilter,
} from "@/lib/requests-query";
import type { DefaultRequestsCalendarLayoutPreference } from "@/lib/user-preferences";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { uiOverline, uiPageLead, uiPageTitle } from "@/lib/typography";

function StatDot() {
  return (
    <span className="hidden text-fg-tertiary sm:inline" aria-hidden>
      ·
    </span>
  );
}

function QueueOverview({
  total,
  aperte,
  nuove,
  oggi,
}: {
  total: number;
  aperte: number;
  nuove: number;
  oggi: number;
}) {
  return (
    <div className="text-sm leading-relaxed text-fg-secondary">
      <p className={uiOverline}>Panoramica coda</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
        <span>
          <span className="tabular-nums font-semibold text-fg-primary">
            {total}
          </span>{" "}
          totali
        </span>
        <StatDot />
        <span>
          <span className="tabular-nums font-semibold text-fg-primary">
            {aperte}
          </span>{" "}
          aperte
        </span>
        <StatDot />
        <span>
          <span className="tabular-nums font-semibold text-fg-primary">
            {nuove}
          </span>{" "}
          nuove
        </span>
        <StatDot />
        <span>
          <span className="tabular-nums font-semibold text-fg-primary">
            {oggi}
          </span>{" "}
          scadenze oggi
        </span>
      </div>
    </div>
  );
}

export function CalendarWorkspace({
  requests,
  currentUserId,
  currentUserRole = "operator",
  assigneeOptions,
  defaultAssignScope = "all",
  defaultCalendarLayout = "month",
}: {
  requests: Request[];
  currentUserId: string;
  currentUserRole?: AppRole;
  assigneeOptions: AssigneeOption[];
  defaultAssignScope?: AssignScopeFilter;
  defaultCalendarLayout?: DefaultRequestsCalendarLayoutPreference;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlMonth = searchParams.get("month");

  const toolbarBaseline = useMemo(
    () => defaultToolbarFilters(defaultAssignScope),
    [defaultAssignScope],
  );

  const [toolbar, setToolbar] = useState<ToolbarFilters>(toolbarBaseline);
  const [sort, setSort] = useState<SortOption>("updated_desc");

  const sources = useMemo(() => collectSources(requests), [requests]);

  const myAssignedCount = useMemo(
    () =>
      currentUserId
        ? requests.filter((r) => r.assignedUserId === currentUserId).length
        : 0,
    [requests, currentUserId],
  );

  const filtered = useMemo(
    () =>
      filterByToolbar(requests, toolbar, {
        currentUserId,
      }),
    [requests, toolbar, currentUserId],
  );

  const withoutDeadlineCount = useMemo(
    () => filtered.filter((r) => r.nextActionAt == null).length,
    [filtered],
  );

  const showTaskRequestMeta = canViewAllTeamsRequestMeta(currentUserRole);

  const replaceSearch = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    if (urlMonth) return;
    replaceSearch((params) => {
      params.set("month", monthParamFromDate(new Date()));
    });
  }, [urlMonth, replaceSearch]);

  const onMonthParamChange = useCallback(
    (month: string) => {
      replaceSearch((params) => {
        params.set("month", month);
      });
    },
    [replaceSearch],
  );

  const resetAll = useCallback(() => {
    setToolbar(toolbarBaseline);
    setSort("updated_desc");
  }, [toolbarBaseline]);

  const total = requests.length;
  const aperte = countOpenRequests(requests);
  const nuove = countByStatus(requests, "new");
  const oggi = countDueToday(requests);

  if (total === 0) {
    return (
      <div className="space-y-6 md:space-y-7">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <h1 className={uiPageTitle}>Calendario</h1>
            <p className={cn(uiPageLead, "max-w-xl")}>
              Scadenze e task sulle richieste, in vista mensile o settimanale.
            </p>
          </div>
          <Link
            href="/app/requests"
            className={cn(
              uiBtnSecondary,
              "inline-flex shrink-0 self-start items-center justify-center rounded-lg px-4 py-2.5 text-sm",
            )}
          >
            Elenco richieste
          </Link>
        </header>
        <RequestsDatabaseEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <h1 className={uiPageTitle}>Calendario</h1>
          <p className={cn(uiPageLead, "max-w-xl")}>
            Scadenze e task sulle richieste filtrate. Clicca un giorno o un
            evento per i dettagli.
          </p>
        </div>
        <Link
          href="/app/requests"
          className={cn(
            uiBtnSecondary,
            "inline-flex shrink-0 self-start items-center justify-center rounded-lg px-4 py-2.5 text-sm",
          )}
        >
          Elenco richieste
        </Link>
      </header>

      <QueueOverview total={total} aperte={aperte} nuove={nuove} oggi={oggi} />

      <RequestsToolbar
        toolbar={toolbar}
        onToolbarChange={setToolbar}
        sources={sources}
        sort={sort}
        onSortChange={setSort}
        onReset={resetAll}
        currentUserId={currentUserId}
        assigneeOptions={assigneeOptions}
        myAssignedCount={myAssignedCount}
        variant="calendar"
        filterBaseline={toolbarBaseline}
      />

      {filtered.length === 0 ? (
        <RequestsEmptyState onReset={resetAll} />
      ) : (
        <RequestsCalendar
          requests={filtered}
          filteredCount={filtered.length}
          withoutDeadlineCount={withoutDeadlineCount}
          showTaskRequestMeta={showTaskRequestMeta}
          monthParam={urlMonth}
          onMonthParamChange={onMonthParamChange}
          defaultLayout={defaultCalendarLayout}
        />
      )}
    </div>
  );
}
