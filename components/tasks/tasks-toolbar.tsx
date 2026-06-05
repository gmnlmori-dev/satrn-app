"use client";

import type { AssigneeOption } from "@/types/profile";
import type { AssignScopeFilter } from "@/lib/requests-query";
import type { TaskStatusFilter, TaskToolbarFilters } from "@/lib/tasks-query";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/cn";
import { uiControl } from "@/lib/ui-classes";
import { uiFilterLabel } from "@/lib/typography";
import { uiPanel } from "@/lib/surfaces";

type Props = {
  toolbar: TaskToolbarFilters;
  onToolbarChange: (t: TaskToolbarFilters) => void;
  currentUserId: string;
  assigneeOptions: AssigneeOption[];
  myAssignedCount: number;
};

const assignSegments: { value: AssignScopeFilter; label: string }[] = [
  { value: "mine", label: "Le mie" },
  { value: "all", label: "Tutte" },
  { value: "unassigned", label: "Non assegnate" },
];

const statusSegments: { value: TaskStatusFilter; label: string }[] = [
  { value: "open", label: "Aperte" },
  { value: "done", label: "Completate" },
  { value: "all", label: "Tutte" },
];

export function TasksToolbar({
  toolbar,
  onToolbarChange,
  myAssignedCount,
}: Props) {
  const assignValue =
    toolbar.assignScope === "user" ? "all" : toolbar.assignScope;

  return (
    <div className={uiPanel}>
      <div className="p-4 sm:p-5">
        <label htmlFor="task-search" className={uiFilterLabel}>
          Cerca task
        </label>
        <div className="relative mt-1">
          <span
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary"
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            id="task-search"
            type="search"
            autoComplete="off"
            placeholder="Titolo task…"
            value={toolbar.search}
            onChange={(e) =>
              onToolbarChange({ ...toolbar, search: e.target.value })
            }
            className={cn(uiControl, "py-2.5 pl-9")}
          />
        </div>
      </div>

      <div className="grid gap-3 border-t border-line-default px-4 py-3 sm:grid-cols-2 sm:px-5">
        <div>
          <p className="mb-2 text-xs font-medium text-fg-tertiary">Assegnazione</p>
          <SegmentedControl
            ariaLabel="Filtro assegnazione task"
            value={assignValue}
            onChange={(value) =>
              onToolbarChange({
                ...toolbar,
                assignScope: value as AssignScopeFilter,
                assignUserId: "",
              })
            }
            options={assignSegments.map((s) => ({
              value: s.value,
              label:
                s.value === "mine" && myAssignedCount > 0
                  ? `${s.label} (${myAssignedCount})`
                  : s.label,
            }))}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-fg-tertiary">Stato</p>
          <SegmentedControl
            ariaLabel="Filtro stato task"
            value={toolbar.status}
            onChange={(value) =>
              onToolbarChange({
                ...toolbar,
                status: value as TaskStatusFilter,
              })
            }
            options={statusSegments}
          />
        </div>
      </div>
    </div>
  );
}
