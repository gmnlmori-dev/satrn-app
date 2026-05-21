"use client";

import type { AssigneeOption } from "@/types/profile";
import type { RequestPriority, RequestStatus } from "@/types/request";
import { priorityLabel, statusLabel } from "@/lib/labels";
import {
  defaultToolbarFilters,
  filtersActive,
  type SortOption,
  type ToolbarFilters,
} from "@/lib/requests-query";
import { cn } from "@/lib/cn";
import {
  uiBtnSecondary,
  uiFilterField,
  uiFilterFieldsRow,
  uiFilterFieldSort,
  uiFilterFieldWide,
  uiFilterSelect,
} from "@/lib/ui-classes";

import { uiFilterLabel } from "@/lib/typography";

const filterLabelClass = uiFilterLabel;

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
  assigneeOptions: AssigneeOption[];
  hideSort?: boolean;
  filterBaseline?: ToolbarFilters;
};

function FilterField({
  className,
  label,
  htmlFor,
  children,
}: {
  className?: string;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={filterLabelClass}>
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function RequestsFilters({
  filters,
  onFiltersChange,
  sources,
  sort,
  onSortChange,
  onReset,
  assigneeOptions,
  hideSort = false,
  filterBaseline,
}: Props) {
  const baseline = filterBaseline ?? defaultToolbarFilters();
  const resetDisabled =
    !filtersActive(filters, baseline) && (hideSort || sort === "updated_desc");

  return (
    <div className={uiFilterFieldsRow}>
      <FilterField
        className={uiFilterFieldWide}
        label="Assegnatario"
        htmlFor="req-filter-assign-scope"
      >
        <select
          id="req-filter-assign-scope"
          className={uiFilterSelect}
          value={filters.assignScope}
          onChange={(e) => {
            const assignScope = e.target.value as ToolbarFilters["assignScope"];
            onFiltersChange({
              ...filters,
              assignScope,
              assignUserId:
                assignScope === "user" ? filters.assignUserId : "",
            });
          }}
        >
          <option value="all">Tutte le richieste</option>
          <option value="mine">Le mie (assegnate a me)</option>
          <option value="unassigned">Non assegnate</option>
          <option value="user">Utente specifico…</option>
        </select>
      </FilterField>

      {filters.assignScope === "user" ? (
        <FilterField
          className={uiFilterFieldWide}
          label="Utente"
          htmlFor="req-filter-assign-user"
        >
          <select
            id="req-filter-assign-user"
            className={uiFilterSelect}
            value={filters.assignUserId}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                assignUserId: e.target.value,
              })
            }
          >
            <option value="">Scegli…</option>
            {assigneeOptions.map((o) => (
              <option key={o.userId} value={o.userId}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>
      ) : null}

      <FilterField
        className={uiFilterField}
        label="Stato"
        htmlFor="req-filter-status"
      >
        <select
          id="req-filter-status"
          className={uiFilterSelect}
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
      </FilterField>

      <FilterField
        className={uiFilterField}
        label="Priorità"
        htmlFor="req-filter-priority"
      >
        <select
          id="req-filter-priority"
          className={uiFilterSelect}
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
      </FilterField>

      <FilterField
        className={uiFilterField}
        label="Fonte"
        htmlFor="req-filter-source"
      >
        <select
          id="req-filter-source"
          className={uiFilterSelect}
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
      </FilterField>

      {hideSort ? null : (
        <FilterField
          className={uiFilterFieldSort}
          label="Ordina per"
          htmlFor="req-sort"
        >
          <select
            id="req-sort"
            className={uiFilterSelect}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>
      )}

      <div className="flex w-full shrink-0 items-end sm:w-auto">
        <button
          type="button"
          onClick={onReset}
          disabled={resetDisabled}
          className={cn(uiBtnSecondary, "w-full whitespace-nowrap sm:w-auto")}
        >
          Reset filtri
        </button>
      </div>
    </div>
  );
}
