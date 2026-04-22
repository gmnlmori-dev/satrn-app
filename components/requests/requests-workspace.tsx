"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Request } from "@/types/request";
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
  filterByToolbar,
  sortRequests,
  type SortOption,
  type ToolbarFilters,
} from "@/lib/requests-query";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { uiOverline, uiPageLead, uiPageTitle } from "@/lib/typography";

function StatDot() {
  return (
    <span
      className="hidden text-slate-300 sm:inline dark:text-slate-600"
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
        "rounded-xl border border-slate-200/60 bg-slate-50/90 px-4 py-3 text-sm leading-relaxed text-slate-600",
        "dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400"
      )}
    >
      <p className={uiOverline}>
        Panoramica coda
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
        <span>
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {total}
          </span>{" "}
          totali
        </span>
        <StatDot />
        <span>
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {aperte}
          </span>{" "}
          aperte
        </span>
        <StatDot />
        <span>
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {nuove}
          </span>{" "}
          nuove
        </span>
        <StatDot />
        <span>
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="font-medium text-slate-600 dark:text-slate-300">Priorità</span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-1 rounded-full bg-rose-300/75 dark:bg-rose-500/45"
        />
        Alta
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-1 rounded-full bg-amber-300/75 dark:bg-amber-500/45"
        />
        Media
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2.5 w-1 rounded-full bg-slate-300/85 dark:bg-slate-500/50"
        />
        Bassa
      </span>
    </div>
  );
}

export function RequestsWorkspace({ requests }: { requests: Request[] }) {
  const [toolbar, setToolbar] = useState<ToolbarFilters>(defaultToolbarFilters());
  const [sort, setSort] = useState<SortOption>("updated_desc");

  const sources = useMemo(() => collectSources(requests), [requests]);

  const processed = useMemo(() => {
    const matched = filterByToolbar(requests, toolbar);
    return sortRequests(matched, sort);
  }, [requests, toolbar, sort]);

  const resetAll = useCallback(() => {
    setToolbar(defaultToolbarFilters());
    setSort("updated_desc");
  }, []);

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
      />

      {processed.length === 0 ? (
        <RequestsEmptyState onReset={resetAll} />
      ) : (
        <section className="space-y-3" aria-labelledby="requests-results-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3
              id="requests-results-heading"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Elenco
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {processed.length}
              </span>
              {processed.length === total
                ? " richieste"
                : ` su ${total} richieste`}
            </p>
          </div>
          <PriorityLegend />
          <RequestsTable requests={processed} />
        </section>
      )}
    </div>
  );
}
