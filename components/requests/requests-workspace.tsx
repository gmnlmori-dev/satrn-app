"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Request } from "@/types/request";
import type { AssigneeOption } from "@/types/profile";
import {
  RequestsDatabaseEmptyState,
  RequestsEmptyState,
} from "@/components/requests/requests-empty-state";
import { RequestsTable } from "@/components/requests/requests-table";
import { RequestsToolbar } from "@/components/requests/requests-toolbar";
import { cn } from "@/lib/cn";
import {
  countByStatus,
  countDueToday,
  countOpenRequests,
} from "@/lib/requests-overview";
import {
  collectSources,
  defaultToolbarFilters,
  filterByAssignScope,
  filterByToolbar,
  sortRequests,
  type SortOption,
  type ToolbarFilters,
  type AssignScopeFilter,
} from "@/lib/requests-query";
import { requestIsAssignedTo } from "@/lib/request-assignees";
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

function PriorityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-tertiary">
      <span className="font-medium text-fg-secondary">Priorità</span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-1 rounded-full bg-danger" />
        Alta
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-1 rounded-full bg-warning" />
        Media
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-1 rounded-full bg-fg-tertiary" />
        Bassa
      </span>
    </div>
  );
}

export function RequestsWorkspace({
  requests,
  currentUserId,
  assigneeOptions,
  defaultAssignScope = "all",
}: {
  requests: Request[];
  currentUserId: string;
  assigneeOptions: AssigneeOption[];
  defaultAssignScope?: AssignScopeFilter;
}) {
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
        ? requests.filter((r) => requestIsAssignedTo(r, currentUserId)).length
        : 0,
    [requests, currentUserId],
  );

  const scopedRequests = useMemo(
    () =>
      filterByAssignScope(
        requests,
        toolbar.assignScope,
        toolbar.assignUserId,
        { currentUserId },
      ),
    [requests, toolbar.assignScope, toolbar.assignUserId, currentUserId],
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

  const resetAll = useCallback(() => {
    setToolbar(toolbarBaseline);
    setSort("updated_desc");
  }, [toolbarBaseline]);

  const total = scopedRequests.length;
  const aperte = countOpenRequests(scopedRequests);
  const nuove = countByStatus(scopedRequests, "new");
  const oggi = countDueToday(scopedRequests);

  if (requests.length === 0) {
    return (
      <div className="space-y-6 md:space-y-7">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <h1 className={uiPageTitle}>Scrivania progetti</h1>
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
          <h1 className={uiPageTitle}>Scrivania progetti</h1>
          <p className={cn(uiPageLead, "max-w-xl")}>
            Cerca e filtra l’elenco, poi apri una riga per il dettaglio.
          </p>
        </div>
        <Link
          href="/app/calendar"
          className={cn(
            uiBtnSecondary,
            "inline-flex shrink-0 self-start items-center justify-center rounded-lg px-4 py-2.5 text-sm",
          )}
        >
          Calendario
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
        filterBaseline={toolbarBaseline}
      />

      {filtered.length === 0 ? (
        <RequestsEmptyState onReset={resetAll} />
      ) : (
        <section className="space-y-3" aria-label="Risultati progetti">
          <p className="text-sm text-fg-tertiary">
            <span className="tabular-nums font-semibold text-fg-primary">
              {forList.length}
            </span>
            {forList.length === scopedRequests.length
              ? " progetti"
              : ` su ${scopedRequests.length} progetti`}
          </p>
          <PriorityLegend />
          <RequestsTable requests={forList} />
        </section>
      )}
    </div>
  );
}
