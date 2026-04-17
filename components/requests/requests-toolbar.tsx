"use client";

import { useId, useState } from "react";
import type { SortOption, ToolbarFilters } from "@/lib/requests-query";
import { filtersActive } from "@/lib/requests-query";
import { RequestsFilters } from "@/components/requests/requests-filters";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";

const searchInputClass = cn(
  uiTransition,
  "w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-9 pr-3 text-[15px] leading-snug text-slate-900 placeholder:text-slate-400",
  "focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-100/10"
);

const searchLabelClass =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

type Props = {
  toolbar: ToolbarFilters;
  onToolbarChange: (t: ToolbarFilters) => void;
  sources: string[];
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  onReset: () => void;
};

export function RequestsToolbar({
  toolbar,
  onToolbarChange,
  sources,
  sort,
  onSortChange,
  onReset,
}: Props) {
  const filtersPanelId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showResetHint =
    filtersActive(toolbar) || sort !== "updated_desc";

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="p-4 sm:p-5">
        <label htmlFor="req-search" className={searchLabelClass}>
          Cerca nella coda
        </label>
        <div className="relative mt-1">
          <span
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </span>
          <input
            id="req-search"
            type="search"
            autoComplete="off"
            placeholder="Titolo, azienda, contatto, azione…"
            value={toolbar.search}
            onChange={(e) =>
              onToolbarChange({ ...toolbar, search: e.target.value })
            }
            className={searchInputClass}
          />
        </div>
      </div>

      <div className="border-t border-slate-100/90 dark:border-slate-800/90">
        <button
          type="button"
          id="req-filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls={filtersPanelId}
          onClick={() => setFiltersOpen((o) => !o)}
          className={cn(
            uiTransition,
            uiFocusRingInset,
            "flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5",
            "text-sm font-medium text-slate-800 dark:text-slate-200",
            "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          )}
        >
          <span>Filtri e ordinamento</span>
          <span className="flex min-w-0 items-center gap-2">
            {showResetHint ? (
              <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
                Attivi
              </span>
            ) : null}
            <svg
              className={cn(
                "h-5 w-5 shrink-0 text-slate-500 transition-transform dark:text-slate-400",
                filtersOpen && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
        </button>

        {filtersOpen ? (
          <div
            id={filtersPanelId}
            role="region"
            aria-labelledby="req-filters-toggle"
            className="border-t border-slate-100/90 bg-slate-50/40 px-4 pb-5 pt-4 dark:border-slate-800/90 dark:bg-slate-950/30 sm:px-5"
          >
            <RequestsFilters
              filters={toolbar}
              onFiltersChange={onToolbarChange}
              sources={sources}
              sort={sort}
              onSortChange={onSortChange}
              onReset={onReset}
            />
            {showResetHint ? (
              <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                Suggerimento: &quot;Reset filtri&quot; ripristina l’ordine per data di
                aggiornamento.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
