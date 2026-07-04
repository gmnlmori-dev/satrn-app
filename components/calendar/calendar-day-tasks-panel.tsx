"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalendarTaskEntry } from "@/lib/next-action-tasks";
import { isCalendarTaskOverdue } from "@/lib/next-action-tasks";
import { toggleNextActionTask } from "@/lib/actions/toggle-next-action-task";
import { toggleTaskDone } from "@/lib/actions/toggle-task-done";
import { TaskRecurrenceSummary } from "@/components/tasks/task-recurrence-summary";
import { ExpandableChecklistTaskText } from "@/components/requests/checklist-task-text";
import { taskAssigneesLabel } from "@/lib/task-assignees";
import { isStandaloneTaskOverdue } from "@/lib/task-windows";
import { applyTaskToggleResult } from "@/lib/task-recurrence";
import { cn } from "@/lib/cn";
import { formatCalendarDay, formatTime, isSameCalendarDay, toTimeInputValue } from "@/lib/date";
import { uiBtnGhost, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";
import type { Task } from "@/types/task";

type Props = {
  date: Date;
  checklistEntries: CalendarTaskEntry[];
  standaloneTasks: Task[];
  showRequestMeta?: boolean;
  onClose: () => void;
  onChecklistChange: (entries: CalendarTaskEntry[]) => void;
  onStandaloneChange: (tasks: Task[]) => void;
};

function formatRequestMeta(entry: CalendarTaskEntry): string {
  const parts: string[] = [];
  if (entry.teamName) parts.push(entry.teamName);
  if (entry.createdByLabel) parts.push(`Creata da ${entry.createdByLabel}`);
  return parts.join(" · ");
}

function hasTime(iso: string): boolean {
  return toTimeInputValue(iso) !== "";
}

export function CalendarDayTasksPanel({
  date,
  checklistEntries,
  standaloneTasks,
  showRequestMeta = false,
  onClose,
  onChecklistChange,
  onStandaloneChange,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { requestTitle: string; tasks: CalendarTaskEntry[] }
    >();
    for (const entry of checklistEntries) {
      const bucket = map.get(entry.requestId) ?? {
        requestTitle: entry.requestTitle,
        tasks: [],
      };
      bucket.tasks.push(entry);
      map.set(entry.requestId, bucket);
    }
    return [...map.entries()];
  }, [checklistEntries]);

  const totalCount = checklistEntries.length + standaloneTasks.length;

  function maybeClose(checklistLeft: number, standaloneLeft: number) {
    if (checklistLeft + standaloneLeft === 0) onClose();
  }

  function toggleChecklist(entry: CalendarTaskEntry, checked: boolean) {
    setError(null);
    setPendingId(entry.task.id);
    const previous = checklistEntries;
    const remaining = checked
      ? checklistEntries.filter(
          (item) =>
            !(
              item.requestId === entry.requestId &&
              item.task.id === entry.task.id
            ),
        )
      : checklistEntries;

    if (checked) onChecklistChange(remaining);

    startTransition(async () => {
      const res = await toggleNextActionTask(
        entry.requestId,
        entry.task.id,
        checked,
      );
      setPendingId(null);
      if (!res.ok) {
        setError(res.message);
        onChecklistChange(previous);
        return;
      }
      router.refresh();
      maybeClose(remaining.length, standaloneTasks.length);
    });
  }

  function toggleStandalone(task: Task, checked: boolean) {
    setError(null);
    setPendingId(task.id);

    startTransition(async () => {
      const res = await toggleTaskDone(task.id, checked);
      setPendingId(null);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const nextTasks = standaloneTasks
        .map((item) =>
          item.id === task.id ? applyTaskToggleResult(item, res) : item,
        )
        .filter((item) => {
          if (item.done) return false;
          if (!item.dueAt) return true;
          return isSameCalendarDay(item.dueAt, date);
        });
      onStandaloneChange(nextTasks);
      router.refresh();
      maybeClose(checklistEntries.length, nextTasks.length);
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi elenco task"
        className="fixed inset-0 z-40 bg-canvas/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-day-tasks-title"
        className={cn(
          uiCard,
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(32rem,85vh)] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-[var(--shadow-surface)]",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-default px-4 py-3">
          <div className="min-w-0">
            <h3
              id="cal-day-tasks-title"
              className="text-sm font-semibold text-fg-primary"
            >
              Scadenze · {formatCalendarDay(date)}
            </h3>
            <p className="mt-0.5 text-xs text-fg-secondary">
              {totalCount} {totalCount === 1 ? "azione" : "azioni"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(uiBtnGhost, "shrink-0 px-2 py-1 text-xs")}
          >
            Chiudi
          </button>
        </div>

        {error ? (
          <p className="border-b border-line-default px-4 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3">
          {standaloneTasks.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-tertiary">
                  Task libere
                </h4>
                <Link
                  href="/app/tasks"
                  className="text-xs text-accent underline-offset-2 hover:underline"
                >
                  Apri Task
                </Link>
              </div>
              <ul className="space-y-1.5">
                {standaloneTasks.map((task) => {
                  const overdue = isStandaloneTaskOverdue(task);
                  const busy = pending && pendingId === task.id;
                  return (
                    <li
                      key={task.id}
                      className="flex items-start gap-2.5 rounded-[8px] border border-dashed border-line-default bg-canvas px-2.5 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        disabled={busy}
                        onChange={(e) => toggleStandalone(task, e.target.checked)}
                        aria-label={`Segna completata: ${task.title}`}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-fg-primary">
                          {task.title}
                        </p>
                        {task.dueAt && hasTime(task.dueAt) ? (
                          <p
                            className={cn(
                              "mt-0.5 text-xs tabular-nums",
                              overdue ? "text-danger" : "text-fg-tertiary",
                            )}
                          >
                            {formatTime(task.dueAt)}
                          </p>
                        ) : null}
                        {taskAssigneesLabel(task) ? (
                          <p className="mt-0.5 text-xs text-fg-tertiary">
                            {taskAssigneesLabel(task)}
                          </p>
                        ) : null}
                        <TaskRecurrenceSummary
                          recurrence={task.recurrence}
                          className="mt-0.5 block"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {checklistEntries.length > 0 ? (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-tertiary">
                Checklist su richieste
              </h4>
              {grouped.map(([requestId, group]) => (
                <div key={requestId} className="space-y-2">
                  <Link
                    href={`/app/requests/${requestId}`}
                    className={cn(
                      uiTransition,
                      "block truncate text-sm font-medium text-accent underline-offset-2 hover:underline",
                    )}
                  >
                    {group.requestTitle}
                  </Link>
                  <ul className="space-y-1.5">
                    {group.tasks.map((entry) => {
                      const overdue = isCalendarTaskOverdue(entry.task);
                      const busy = pending && pendingId === entry.task.id;
                      return (
                        <li
                          key={entry.task.id}
                          className="flex items-start gap-2.5 rounded-[8px] border border-line-default bg-elevated px-2.5 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={entry.task.done}
                            disabled={busy}
                            onChange={(e) =>
                              toggleChecklist(entry, e.target.checked)
                            }
                            aria-label={`Segna completato: ${entry.task.text}`}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
                          />
                          <div className="min-w-0 flex-1">
                            <ExpandableChecklistTaskText
                              text={entry.task.text}
                              done={entry.task.done}
                              size="sm"
                            />
                            {entry.task.dueAt && hasTime(entry.task.dueAt) ? (
                              <p
                                className={cn(
                                  "mt-0.5 text-xs tabular-nums",
                                  overdue ? "text-danger" : "text-fg-tertiary",
                                )}
                              >
                                {formatTime(entry.task.dueAt)}
                              </p>
                            ) : null}
                            {showRequestMeta ? (
                              <p className="mt-0.5 text-xs text-fg-tertiary">
                                {formatRequestMeta(entry) || "—"}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
