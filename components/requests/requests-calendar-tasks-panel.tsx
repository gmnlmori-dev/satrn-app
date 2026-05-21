"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalendarTaskEntry } from "@/lib/next-action-tasks";
import { isCalendarTaskOverdue } from "@/lib/next-action-tasks";
import { toggleNextActionTask } from "@/lib/actions/toggle-next-action-task";
import { cn } from "@/lib/cn";
import { formatCalendarDay, formatTime, toTimeInputValue } from "@/lib/date";
import { uiBtnGhost, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";

type Props = {
  date: Date;
  entries: CalendarTaskEntry[];
  onClose: () => void;
  onEntriesChange: (entries: CalendarTaskEntry[]) => void;
};

function hasTime(iso: string): boolean {
  return toTimeInputValue(iso) !== "";
}

export function RequestsCalendarTasksPanel({
  date,
  entries,
  onClose,
  onEntriesChange,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
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
    for (const entry of entries) {
      const bucket = map.get(entry.requestId) ?? {
        requestTitle: entry.requestTitle,
        tasks: [],
      };
      bucket.tasks.push(entry);
      map.set(entry.requestId, bucket);
    }
    return [...map.entries()];
  }, [entries]);

  function toggleDone(entry: CalendarTaskEntry, checked: boolean) {
    setError(null);
    setPendingTaskId(entry.task.id);
    const previous = entries;
    const remaining = checked
      ? entries.filter(
          (item) =>
            !(
              item.requestId === entry.requestId &&
              item.task.id === entry.task.id
            ),
        )
      : entries;

    if (checked) {
      onEntriesChange(remaining);
    }

    startTransition(async () => {
      const res = await toggleNextActionTask(
        entry.requestId,
        entry.task.id,
        checked,
      );
      setPendingTaskId(null);
      if (!res.ok) {
        setError(res.message);
        onEntriesChange(previous);
        return;
      }
      router.refresh();
      if (remaining.length === 0) {
        onClose();
      }
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
        aria-labelledby="cal-tasks-panel-title"
        className={cn(
          uiCard,
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(28rem,80vh)] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-[var(--shadow-surface)]",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-default px-4 py-3">
          <div className="min-w-0">
            <h3
              id="cal-tasks-panel-title"
              className="text-sm font-semibold text-fg-primary"
            >
              Task · {formatCalendarDay(date)}
            </h3>
            <p className="mt-0.5 text-xs text-fg-secondary">
              {entries.length}{" "}
              {entries.length === 1 ? "azione" : "azioni"}
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
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
                  const busy =
                    pending && pendingTaskId === entry.task.id;
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
                          toggleDone(entry, e.target.checked)
                        }
                        aria-label={`Segna completato: ${entry.task.text}`}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-default accent-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug text-fg-primary",
                            entry.task.done &&
                              "text-fg-tertiary line-through",
                          )}
                        >
                          {entry.task.text}
                        </p>
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
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
