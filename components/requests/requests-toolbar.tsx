"use client";

import { useId, useState } from "react";
import type { AssigneeOption } from "@/types/profile";
import type { AssignScopeFilter, SortOption, ToolbarFilters } from "@/lib/requests-query";
import { filtersActive } from "@/lib/requests-query";
import { RequestsFilters } from "@/components/requests/requests-filters";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/cn";
import { uiControl, uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiFilterLabel } from "@/lib/typography";
import { uiPanel } from "@/lib/surfaces";

export type RequestsViewMode = "list" | "calendar";

type Props = {
  toolbar: ToolbarFilters;
  onToolbarChange: (t: ToolbarFilters) => void;
  sources: string[];
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  onReset: () => void;
  currentUserId: string;
  assigneeOptions: AssigneeOption[];
  myAssignedCount: number;
  viewMode: RequestsViewMode;
  filterBaseline: ToolbarFilters;
};

const assignSegments: { value: AssignScopeFilter; label: string }[] = [
  { value: "mine", label: "Le mie" },
  { value: "all", label: "Tutte" },
  { value: "unassigned", label: "Non assegnate" },
];

export function RequestsToolbar({
  toolbar,
  onToolbarChange,
  sources,
  sort,
  onSortChange,
  onReset,
  currentUserId,
  assigneeOptions,
  myAssignedCount,
  viewMode,
  filterBaseline,
}: Props) {
  const filtersPanelId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showResetHint =
    filtersActive(toolbar, filterBaseline) ||
    (viewMode === "list" && sort !== "updated_desc");

  const assignValue =
    toolbar.assignScope === "user" ? "all" : toolbar.assignScope;

  return (
    <div className={uiPanel}>
      <div className="p-4 sm:p-5">
        <label htmlFor="req-search" className={uiFilterLabel}>
          Cerca nella coda
        </label>
        <div className="relative mt-1">
          <span
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary"
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
            className={cn(uiControl, "py-2.5 pl-9")}
          />
        </div>
      </div>

      <div className="border-t border-line-default px-4 py-3 sm:px-5">
        <p className="mb-2 text-xs font-medium text-fg-tertiary">Assegnazione</p>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="Filtro assegnazione rapido"
            value={assignValue}
            options={assignSegments}
            onChange={(v) =>
              onToolbarChange({
                ...toolbar,
                assignScope: v,
                assignUserId: "",
              })
            }
          />
          {currentUserId && myAssignedCount > 0 && toolbar.assignScope === "mine" ? (
            <span className="rounded-md border border-accent/30 bg-accent-muted px-2 py-1 text-xs font-semibold tabular-nums text-accent">
              {myAssignedCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line-default">
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
            "text-sm font-medium text-fg-primary hover:bg-elevated",
          )}
        >
          <span>
            {viewMode === "calendar" ? "Filtri" : "Filtri e ordinamento"}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            {showResetHint ? (
              <span className="rounded-md border border-warning/30 bg-warning-muted px-2 py-0.5 text-[11px] font-medium text-warning-fg">
                Attivi
              </span>
            ) : null}
            <svg
              className={cn(
                "h-5 w-5 shrink-0 text-fg-tertiary transition-transform",
                filtersOpen && "rotate-180",
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
            className="border-t border-line-default bg-canvas px-4 pb-5 pt-4 sm:px-5"
          >
            <RequestsFilters
              filters={toolbar}
              onFiltersChange={onToolbarChange}
              sources={sources}
              sort={sort}
              onSortChange={onSortChange}
              onReset={onReset}
              assigneeOptions={assigneeOptions}
              hideSort={viewMode === "calendar"}
              filterBaseline={filterBaseline}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
