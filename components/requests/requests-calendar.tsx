"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Request } from "@/types/request";
import type { Task } from "@/types/task";
import type { CalendarTaskEntry } from "@/lib/next-action-tasks";
import {
  extractCalendarTasks,
  effectiveNextActionAt,
  isCalendarTaskOverdue,
} from "@/lib/next-action-tasks";
import { cn } from "@/lib/cn";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  buildWeekGrid,
  groupCalendarTasksByDay,
  groupRequestsByDay,
  groupStandaloneTasksByDay,
  startOfMonth,
  startOfWeek,
  WEEKDAY_LABELS,
  type CalendarCell,
} from "@/lib/calendar-grid";
import {
  formatCalendarWeekRange,
  formatMonthYear,
  formatWeekdayShort,
  monthParamFromDate,
  parseMonthParam,
} from "@/lib/date";
import { uiBtnIcon, uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { RequestsCalendarEvent } from "@/components/requests/requests-calendar-event";
import { RequestsCalendarDayPanel } from "@/components/requests/requests-calendar-day-panel";
import { RequestsCalendarRequestPreviewPanel } from "@/components/requests/requests-calendar-request-preview-panel";
import { CalendarDayTasksPanel } from "@/components/calendar/calendar-day-tasks-panel";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import type { DefaultRequestsCalendarLayoutPreference } from "@/lib/user-preferences";

const MAX_EVENTS_PER_CELL = 3;

type CalendarLayout = DefaultRequestsCalendarLayoutPreference;

type DayOverflow = {
  date: Date;
  requests: Request[];
};

type DayTasksOverflow = {
  date: Date;
  checklistEntries: CalendarTaskEntry[];
  standaloneTasks: Task[];
};

type Props = {
  requests: Request[];
  standaloneTasks?: Task[];
  filteredCount: number;
  withoutDeadlineCount: number;
  showTaskRequestMeta?: boolean;
  monthParam: string | null;
  onMonthParamChange: (month: string) => void;
  defaultLayout?: CalendarLayout;
};

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={dir === "left" ? "M15.75 19.5 8.25 12l7.5-7.5" : "M8.25 4.5 15.75 12l-7.5 7.5"}
      />
    </svg>
  );
}

function ChecklistIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function CalendarCountBadge({
  count,
  overdue,
  onClick,
  className,
  icon,
  variant,
  ariaLabel,
}: {
  count: number;
  overdue: boolean;
  onClick: () => void;
  className?: string;
  icon: React.ReactNode;
  variant: "checklist" | "standalone";
  ariaLabel: string;
}) {
  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        uiTransition,
        "inline-flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center gap-0.5 rounded-[5px] border px-1.5 text-[11px] font-semibold tabular-nums shadow-sm",
        variant === "standalone"
          ? overdue
            ? "border-danger/50 border-dashed bg-danger-muted/40 text-danger hover:bg-danger-muted/60"
            : "border-line-default border-dashed bg-canvas text-fg-secondary hover:bg-elevated"
          : overdue
            ? "border-danger/60 bg-danger-muted/55 text-danger hover:bg-danger-muted/75"
            : "border-accent/40 bg-accent-muted/70 text-accent hover:bg-accent-muted",
        className,
      )}
      aria-label={ariaLabel}
    >
      {icon}
      {count}
    </button>
  );
}

function StandaloneTaskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

/** Altezza minima cella mese: header + 3 eventi compatti + gap. */
const MONTH_CELL_MIN_H = "min-h-[11rem]";

function MonthCell({
  cell,
  events,
  checklistTasks,
  standaloneTasks,
  onMore,
  onTasks,
  onRequestSelect,
}: {
  cell: CalendarCell;
  events: Request[];
  checklistTasks: CalendarTaskEntry[];
  standaloneTasks: Task[];
  onMore: (payload: DayOverflow) => void;
  onTasks: (payload: DayTasksOverflow) => void;
  onRequestSelect: (request: Request) => void;
}) {
  const visible = events.slice(0, MAX_EVENTS_PER_CELL);
  const hidden = events.length - visible.length;
  const checklistOverdue = checklistTasks.some((entry) =>
    isCalendarTaskOverdue(entry.task),
  );
  const standaloneOverdue = standaloneTasks.some((task) =>
    isStandaloneTaskOverdue(task),
  );
  const openDayTasks = () =>
    onTasks({
      date: cell.date,
      checklistEntries: checklistTasks,
      standaloneTasks,
    });

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col border-b border-r border-line-default p-1",
        MONTH_CELL_MIN_H,
        !cell.isCurrentMonth && "bg-canvas/60",
        cell.isToday && "bg-accent-muted/30 ring-1 ring-inset ring-accent/40",
      )}
    >
      <div
        className={cn(
          "relative mb-1 flex shrink-0 items-center justify-between gap-1 px-0.5 text-xs tabular-nums",
          cell.isToday
            ? "font-semibold text-accent"
            : cell.isCurrentMonth
              ? "text-fg-primary"
              : "text-fg-tertiary",
        )}
      >
        <div className="flex items-center gap-1">
          <span>{cell.date.getDate()}</span>
          <CalendarCountBadge
            count={standaloneTasks.length}
            overdue={standaloneOverdue}
            onClick={openDayTasks}
            icon={<StandaloneTaskIcon />}
            variant="standalone"
            ariaLabel={`${standaloneTasks.length} task libere in scadenza`}
          />
        </div>
        <div className="flex items-center gap-1">
          <CalendarCountBadge
            count={checklistTasks.length}
            overdue={checklistOverdue}
            onClick={openDayTasks}
            icon={<ChecklistIcon />}
            variant="checklist"
            ariaLabel={`${checklistTasks.length} checklist in scadenza`}
          />
          {events.length > 0 ? (
            <span className="rounded-[4px] bg-canvas px-1 text-[10px] font-medium text-fg-tertiary">
              {events.length}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {visible.map((r) => (
          <RequestsCalendarEvent
            key={r.id}
            request={r}
            compact
            onSelect={onRequestSelect}
          />
        ))}
        {hidden > 0 ? (
          <button
            type="button"
            onClick={() =>
              onMore({ date: cell.date, requests: events })
            }
            className={cn(
              uiTransition,
              "rounded-[4px] px-1 py-0.5 text-left text-[11px] font-medium text-accent hover:bg-elevated",
            )}
          >
            +{hidden} altre
          </button>
        ) : null}
      </div>
    </div>
  );
}

function WeekColumn({
  cell,
  events,
  checklistTasks,
  standaloneTasks,
  onTasks,
  onRequestSelect,
}: {
  cell: CalendarCell;
  events: Request[];
  checklistTasks: CalendarTaskEntry[];
  standaloneTasks: Task[];
  onTasks: (payload: DayTasksOverflow) => void;
  onRequestSelect: (request: Request) => void;
}) {
  const checklistOverdue = checklistTasks.some((entry) =>
    isCalendarTaskOverdue(entry.task),
  );
  const standaloneOverdue = standaloneTasks.some((task) =>
    isStandaloneTaskOverdue(task),
  );
  const openDayTasks = () =>
    onTasks({
      date: cell.date,
      checklistEntries: checklistTasks,
      standaloneTasks,
    });

  return (
    <div
      className={cn(
        "flex min-h-[12rem] min-w-0 flex-1 flex-col border-r border-line-default last:border-r-0",
        cell.isToday && "bg-accent-muted/20",
      )}
    >
      <div
        className={cn(
          "relative min-h-[3.5rem] border-b border-line-default px-2 py-2 text-center text-xs",
          cell.isToday ? "font-semibold text-accent" : "text-fg-secondary",
        )}
      >
        <div className="absolute left-1 top-1">
          <CalendarCountBadge
            count={standaloneTasks.length}
            overdue={standaloneOverdue}
            onClick={openDayTasks}
            icon={<StandaloneTaskIcon />}
            variant="standalone"
            ariaLabel={`${standaloneTasks.length} task libere in scadenza`}
          />
        </div>
        <div className="absolute right-1 top-1">
          <CalendarCountBadge
            count={checklistTasks.length}
            overdue={checklistOverdue}
            onClick={openDayTasks}
            icon={<ChecklistIcon />}
            variant="checklist"
            ariaLabel={`${checklistTasks.length} checklist in scadenza`}
          />
        </div>
        <span className="block uppercase tracking-wide">
          {formatWeekdayShort(cell.date)}
        </span>
        <span className="mt-0.5 block tabular-nums leading-none">
          {cell.date.getDate()}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-1.5">
        {events.length === 0 ? (
          <span className="px-1 py-2 text-[11px] text-fg-tertiary">—</span>
        ) : (
          events.map((r) => (
            <RequestsCalendarEvent
              key={r.id}
              request={r}
              onSelect={onRequestSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function RequestsCalendar({
  requests,
  standaloneTasks = [],
  filteredCount,
  withoutDeadlineCount,
  showTaskRequestMeta = false,
  monthParam,
  onMonthParamChange,
  defaultLayout = "month",
}: Props) {
  const today = useMemo(() => new Date(), []);

  const [layout, setLayout] = useState<CalendarLayout>(defaultLayout);
  const [anchor, setAnchor] = useState(() => {
    if (defaultLayout === "week") return today;
    return parseMonthParam(monthParam) ?? today;
  });
  const [dayPanel, setDayPanel] = useState<DayOverflow | null>(null);
  const [tasksPanel, setTasksPanel] = useState<DayTasksOverflow | null>(null);
  const [previewRequest, setPreviewRequest] = useState<Request | null>(null);

  const openRequestPreview = useCallback((request: Request) => {
    setPreviewRequest(request);
  }, []);

  useEffect(() => {
    const parsed = parseMonthParam(monthParam);
    if (!parsed || layout !== "month") return;
    setAnchor(parsed);
  }, [monthParam, layout]);

  const handleLayoutChange = useCallback(
    (next: CalendarLayout) => {
      setLayout(next);
      if (next === "week") {
        const d = new Date();
        setAnchor(d);
        onMonthParamChange(monthParamFromDate(d));
        return;
      }
      setAnchor((prev) => {
        const monthStart = startOfMonth(prev);
        onMonthParamChange(monthParamFromDate(monthStart));
        return monthStart;
      });
    },
    [onMonthParamChange],
  );

  const calendarTasks = useMemo(
    () => extractCalendarTasks(requests),
    [requests],
  );
  const byDay = useMemo(() => groupRequestsByDay(requests), [requests]);
  const tasksByDay = useMemo(
    () => groupCalendarTasksByDay(calendarTasks),
    [calendarTasks],
  );
  const standaloneByDay = useMemo(
    () => groupStandaloneTasksByDay(standaloneTasks),
    [standaloneTasks],
  );
  const standaloneDueCount = useMemo(
    () => standaloneTasks.filter((task) => !task.done && task.dueAt).length,
    [standaloneTasks],
  );

  const requestDeadlineCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          effectiveNextActionAt(request) != null &&
          request.status !== "closed",
      ).length,
    [requests],
  );

  const hasAnyDeadlines = useMemo(
    () =>
      requestDeadlineCount > 0 ||
      calendarTasks.length > 0 ||
      standaloneDueCount > 0,
    [requestDeadlineCount, calendarTasks.length, standaloneDueCount],
  );

  const cells = useMemo(
    () =>
      layout === "month"
        ? buildMonthGrid(anchor, today)
        : buildWeekGrid(anchor, today),
    [layout, anchor, today],
  );

  const title = useMemo(() => {
    if (layout === "week") {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      return formatCalendarWeekRange(start, end);
    }
    return formatMonthYear(anchor);
  }, [layout, anchor]);

  const eventsInView = useMemo(() => {
    const keys = new Set(cells.map((cell) => cell.dateKey));
    let n = 0;
    for (const key of keys) {
      n += byDay.get(key)?.length ?? 0;
      n += tasksByDay.get(key)?.length ?? 0;
      n += standaloneByDay.get(key)?.length ?? 0;
    }
    return n;
  }, [cells, byDay, tasksByDay, standaloneByDay]);

  const navigate = useCallback(
    (delta: number) => {
      setAnchor((prev) => {
        const next =
          layout === "month"
            ? addMonths(prev, delta)
            : addDays(prev, delta * 7);
        onMonthParamChange(monthParamFromDate(next));
        return next;
      });
    },
    [layout, onMonthParamChange],
  );

  const goToday = useCallback(() => {
    const d = new Date();
    setAnchor(layout === "month" ? startOfMonth(d) : d);
    onMonthParamChange(monthParamFromDate(d));
  }, [layout, onMonthParamChange]);

  if (!hasAnyDeadlines && filteredCount > 0) {
    return (
      <div className={cn(uiCard, "p-6")}>
        <AppEmptyHint
          title="Nessuna scadenza da mostrare"
          description="Imposta la scadenza generale della prossima azione o aggiungi scadenze ai task in checklist, oppure passa alla vista Elenco."
        />
      </div>
    );
  }

  if (eventsInView === 0) {
    return (
      <div className="space-y-3">
        <CalendarToolbar
          title={title}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onPrev={() => navigate(-1)}
          onNext={() => navigate(1)}
          onToday={goToday}
        />
        <div className={cn(uiCard, "p-6")}>
          <AppEmptyHint
            title="Nessuna scadenza in questo periodo"
            description="Prova un altro mese o allarga i filtri."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-secondary">
        <span className="tabular-nums font-semibold text-fg-primary">
          {requestDeadlineCount}
        </span>{" "}
        scadenze richieste
        {calendarTasks.length > 0 ? (
          <>
            {" "}
            ·{" "}
            <span className="tabular-nums font-semibold text-fg-primary">
              {calendarTasks.length}
            </span>{" "}
            checklist scadenti
          </>
        ) : null}
        {standaloneDueCount > 0 ? (
          <>
            {" "}
            ·{" "}
            <span className="tabular-nums font-semibold text-fg-primary">
              {standaloneDueCount}
            </span>{" "}
            task libere
          </>
        ) : null}
        {withoutDeadlineCount > 0 ? (
          <>
            {" "}
            ·{" "}
            <span className="tabular-nums font-semibold text-fg-primary">
              {withoutDeadlineCount}
            </span>{" "}
            senza scadenza generale
          </>
        ) : null}
      </p>

      <CalendarToolbar
        title={title}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
      />

      <div className={cn(uiCard, "overflow-hidden")}>
        {layout === "month" ? (
          <div role="grid" aria-label="Calendario mensile">
            <div
              className="grid grid-cols-7 border-b border-line-default bg-canvas"
              role="row"
            >
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-r border-line-default px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-fg-tertiary last:border-r-0"
                  role="columnheader"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" role="rowgroup">
              {cells.map((cell) => (
                <MonthCell
                  key={cell.dateKey}
                  cell={cell}
                  events={byDay.get(cell.dateKey) ?? []}
                  checklistTasks={tasksByDay.get(cell.dateKey) ?? []}
                  standaloneTasks={standaloneByDay.get(cell.dateKey) ?? []}
                  onMore={setDayPanel}
                  onTasks={setTasksPanel}
                  onRequestSelect={openRequestPreview}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex"
            role="grid"
            aria-label="Calendario settimanale"
          >
            {cells.map((cell) => (
              <WeekColumn
                key={cell.dateKey}
                cell={cell}
                events={byDay.get(cell.dateKey) ?? []}
                checklistTasks={tasksByDay.get(cell.dateKey) ?? []}
                standaloneTasks={standaloneByDay.get(cell.dateKey) ?? []}
                onTasks={setTasksPanel}
                onRequestSelect={openRequestPreview}
              />
            ))}
          </div>
        )}
      </div>

      {dayPanel ? (
        <RequestsCalendarDayPanel
          date={dayPanel.date}
          requests={dayPanel.requests}
          onClose={() => setDayPanel(null)}
          onRequestSelect={openRequestPreview}
        />
      ) : null}

      {previewRequest ? (
        <RequestsCalendarRequestPreviewPanel
          request={previewRequest}
          showRequestMeta={showTaskRequestMeta}
          onClose={() => setPreviewRequest(null)}
        />
      ) : null}

      {tasksPanel ? (
        <CalendarDayTasksPanel
          date={tasksPanel.date}
          checklistEntries={tasksPanel.checklistEntries}
          standaloneTasks={tasksPanel.standaloneTasks}
          showRequestMeta={showTaskRequestMeta}
          onClose={() => setTasksPanel(null)}
          onChecklistChange={(checklistEntries) =>
            setTasksPanel((prev) =>
              prev ? { ...prev, checklistEntries } : null,
            )
          }
          onStandaloneChange={(standaloneTasks) =>
            setTasksPanel((prev) =>
              prev ? { ...prev, standaloneTasks } : null,
            )
          }
        />
      ) : null}
    </div>
  );
}

function CalendarToolbar({
  title,
  layout,
  onLayoutChange,
  onPrev,
  onNext,
  onToday,
}: {
  title: string;
  layout: CalendarLayout;
  onLayoutChange: (l: CalendarLayout) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className={uiBtnIcon}
          aria-label="Periodo precedente"
        >
          <ChevronIcon dir="left" />
        </button>
        <h3 className="min-w-0 flex-1 truncate px-1 text-center text-sm font-semibold text-fg-primary sm:min-w-[10rem]">
          {title}
        </h3>
        <button
          type="button"
          onClick={onNext}
          className={uiBtnIcon}
          aria-label="Periodo successivo"
        >
          <ChevronIcon dir="right" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onToday} className={uiBtnSecondary}>
          Oggi
        </button>
        <SegmentedControl
          ariaLabel="Layout calendario"
          value={layout}
          options={[
            { value: "month", label: "Mese" },
            { value: "week", label: "Settimana" },
          ]}
          onChange={onLayoutChange}
        />
      </div>
    </div>
  );
}
