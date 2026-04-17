"use client";

import type { RequestPriority, RequestStatus } from "@/types/request";
import { priorityLabel, statusLabel } from "@/lib/labels";
import type { SortOption, ToolbarFilters } from "@/lib/requests-query";
import { filtersActive } from "@/lib/requests-query";
import { cn } from "@/lib/cn";
import { uiBtnSecondary, uiTransition } from "@/lib/ui-classes";

const filterLabelClass =
  "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";

const controlClass = cn(
  uiTransition,
  "w-full min-w-0 rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] leading-snug text-slate-900",
  "focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-100/10"
);

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "updated_desc", label: "Aggiornato · più recenti" },
  { value: "updated_asc", label: "Aggiornato · meno recenti" },
  { value: "priority_desc", label: "Priorità · alta prima" },
  { value: "priority_asc", label: "Priorità · bassa prima" },
  { value: "status_asc", label: "Stato · pipeline" },
  { value: "status_desc", label: "Stato · inverso" },
];

const statuses: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const priorities: RequestPriority[] = ["high", "medium", "low"];

type Props = {
  filters: ToolbarFilters;
  onFiltersChange: (next: ToolbarFilters) => void;
  sources: string[];
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  onReset: () => void;
};

export function RequestsFilters({
  filters,
  onFiltersChange,
  sources,
  sort,
  onSortChange,
  onReset,
}: Props) {
  const resetDisabled =
    !filtersActive(filters) && sort === "updated_desc";

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <div className="min-w-0 sm:col-span-1">
        <label htmlFor="req-filter-status" className={filterLabelClass}>
          Stato
        </label>
        <select
          id="req-filter-status"
          className={controlClass}
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: e.target.value as RequestStatus | "all",
            })
          }
        >
          <option value="all">Tutti gli stati</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 sm:col-span-1">
        <label htmlFor="req-filter-priority" className={filterLabelClass}>
          Priorità
        </label>
        <select
          id="req-filter-priority"
          className={controlClass}
          value={filters.priority}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              priority: e.target.value as RequestPriority | "all",
            })
          }
        >
          <option value="all">Tutte le priorità</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              {priorityLabel[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 sm:col-span-1">
        <label htmlFor="req-filter-source" className={filterLabelClass}>
          Fonte
        </label>
        <select
          id="req-filter-source"
          className={controlClass}
          value={filters.source}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              source: e.target.value,
            })
          }
        >
          <option value="all">Tutte le fonti</option>
          {sources.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 sm:col-span-2 lg:col-span-2 xl:col-span-2">
        <label htmlFor="req-sort" className={filterLabelClass}>
          Ordina per
        </label>
        <select
          id="req-sort"
          className={controlClass}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-0 items-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
        <button
          type="button"
          onClick={onReset}
          disabled={resetDisabled}
          className={cn(uiBtnSecondary, "w-full")}
        >
          Reset filtri
        </button>
      </div>
    </div>
  );
}
