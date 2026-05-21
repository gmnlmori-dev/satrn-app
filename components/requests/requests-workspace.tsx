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
import { RequestsTable } from "@/components/requests/requests-table";
import {
  RequestsToolbar,
  type RequestsViewMode,
} from "@/components/requests/requests-toolbar";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
  sortRequests,
  type SortOption,
  type ToolbarFilters,
  type AssignScopeFilter,
} from "@/lib/requests-query";
import type {
  DefaultRequestsCalendarLayoutPreference,
  DefaultRequestsViewPreference,
} from "@/lib/user-preferences";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { uiOverline, uiPageLead, uiPageTitle } from "@/lib/typography";

function viewFromSearchParam(
  raw: string | null,
  fallback: DefaultRequestsViewPreference,
): RequestsViewMode {
  if (raw === "calendar") return "calendar";
  if (raw === "list") return "list";
  return fallback;
}

function StatDot() {
  return (
    <span
          className="hidden text-fg-tertiary sm:inline"
      aria-hidden
    >
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
    <div
      className={cn(
        "text-sm leading-relaxed text-fg-secondary"
      )}
    >
      <p className={uiOverline}>
        Panoramica coda
      </p>
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

function PriorityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-tertiary">
      <span className="font-medium text-fg-secondary">Priorità</span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-1 rounded-full bg-danger"
        />
        Alta
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-1 rounded-full bg-warning"
        />
        Media
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-1 rounded-full bg-fg-tertiary"
        />
        Bassa
      </span>
    </div>
  );
}

export function RequestsWorkspace({
  requests,
  currentUserId,
  currentUserRole = "operator",
  assigneeOptions,
  defaultAssignScope = "all",
  defaultViewMode = "list",
  defaultCalendarLayout = "month",
}: {
  requests: Request[];
  currentUserId: string;
  currentUserRole?: AppRole;
  assigneeOptions: AssigneeOption[];
  defaultAssignScope?: AssignScopeFilter;
  defaultViewMode?: DefaultRequestsViewPreference;
  defaultCalendarLayout?: DefaultRequestsCalendarLayoutPreference;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const urlView = searchParams.get("view");
  const urlMonth = searchParams.get("month");

  const toolbarBaseline = useMemo(
    () => defaultToolbarFilters(defaultAssignScope),
    [defaultAssignScope],
  );

  const [toolbar, setToolbar] = useState<ToolbarFilters>(toolbarBaseline);
  const [sort, setSort] = useState<SortOption>("updated_desc");
  const [viewMode, setViewMode] = useState<RequestsViewMode>(() =>
    viewFromSearchParam(urlView, defaultViewMode),
  );

  useEffect(() => {
    setViewMode(viewFromSearchParam(urlView, defaultViewMode));
  }, [urlView, defaultViewMode]);

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

  const forList = useMemo(
    () => sortRequests(filtered, sort),
    [filtered, sort],
  );

  const forCalendar = useMemo(
    () => filtered.filter((r) => r.nextActionAt != null),
    [filtered],
  );

  const withoutDeadlineCount = filtered.length - forCalendar.length;
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
    if (urlView != null || defaultViewMode === "list") return;
    replaceSearch((params) => {
      params.set("view", defaultViewMode);
      if (defaultViewMode === "calendar" && !params.get("month")) {
        params.set("month", monthParamFromDate(new Date()));
      }
    });
  }, [urlView, defaultViewMode, replaceSearch]);

  const setView = useCallback(
    (mode: RequestsViewMode) => {
      setViewMode(mode);
      replaceSearch((params) => {
        if (mode === "calendar") {
          params.set("view", "calendar");
          if (!params.get("month")) {
            params.set("month", monthParamFromDate(new Date()));
          }
        } else {
          params.set("view", "list");
          params.delete("month");
        }
      });
    },
    [replaceSearch],
  );

  const onMonthParamChange = useCallback(
    (month: string) => {
      replaceSearch((params) => {
        params.set("view", "calendar");
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
            <h1 className={uiPageTitle}>
              Scrivania richieste
            </h1>
            <p className={cn(uiPageLead, "max-w-xl")}>
              Cerca e filtra l’elenco, poi apri una riga per il dettaglio.
            </p>
          </div>
          <Link
            href="/app/dashboard"
            className={cn(
              uiBtnSecondary,
              "inline-flex shrink-0 self-start items-center justify-center rounded-lg px-4 py-2.5 text-sm",
            )}
          >
            Dashboard
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
          <h1 className={uiPageTitle}>
            Scrivania richieste
          </h1>
          <p className={cn(uiPageLead, "max-w-xl")}>
            Cerca e filtra l’elenco, poi apri una riga per il dettaglio.
          </p>
        </div>
        <Link
          href="/app/dashboard"
          className={cn(
            uiBtnSecondary,
            "inline-flex shrink-0 self-start items-center justify-center rounded-lg px-4 py-2.5 text-sm",
          )}
        >
          Dashboard
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
        viewMode={viewMode}
        filterBaseline={toolbarBaseline}
      />

      {filtered.length === 0 ? (
        <RequestsEmptyState onReset={resetAll} />
      ) : (
        <section className="space-y-3" aria-label="Risultati richieste">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SegmentedControl
              ariaLabel="Vista risultati: Elenco o Calendario"
              value={viewMode}
              options={[
                { value: "list", label: "Elenco" },
                { value: "calendar", label: "Calendario" },
              ]}
              onChange={setView}
            />
            {viewMode === "list" ? (
              <p className="text-sm text-fg-tertiary">
                <span className="tabular-nums font-semibold text-fg-primary">
                  {forList.length}
                </span>
                {forList.length === total
                  ? " richieste"
                  : ` su ${total} richieste`}
              </p>
            ) : null}
          </div>

          <PriorityLegend />

          {viewMode === "list" ? (
            <RequestsTable requests={forList} />
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
        </section>
      )}
    </div>
  );
}
