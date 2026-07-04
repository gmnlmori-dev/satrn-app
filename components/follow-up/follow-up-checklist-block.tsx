"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { ExpandableChecklistTaskText } from "@/components/requests/checklist-task-text";
import { toggleNextActionTask } from "@/lib/actions/toggle-next-action-task";
import { formatDateTime } from "@/lib/date";
import {
  isCalendarTaskOverdue,
  sortChecklistEntriesForRequest,
  type CalendarTaskEntry,
} from "@/lib/next-action-tasks";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";

type RequestGroup = {
  requestTitle: string;
  companyName: string;
  nextActionAt: string | null;
  requestPriority: CalendarTaskEntry["requestPriority"];
  teamName: string | null;
  tasks: CalendarTaskEntry[];
};

function formatRequestMeta(group: RequestGroup): string {
  const parts: string[] = [];
  if (group.companyName.trim()) parts.push(group.companyName.trim());
  if (group.teamName) parts.push(group.teamName);
  if (group.nextActionAt) {
    parts.push(`Scadenza prossima azione: ${formatDateTime(group.nextActionAt)}`);
  } else {
    parts.push("Richiesta senza scadenza");
  }
  return parts.join(" · ");
}

export function FollowUpChecklistBlock({
  entries,
}: {
  entries: CalendarTaskEntry[];
}) {
  const router = useRouter();
  const { pulseTopBar } = useDetailSaveFeedback();
  const [pending, startTransition] = useTransition();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, RequestGroup>();
    for (const entry of entries) {
      const bucket = map.get(entry.requestId) ?? {
        requestTitle: entry.requestTitle,
        companyName: entry.companyName,
        nextActionAt: entry.nextActionAt,
        requestPriority: entry.requestPriority,
        teamName: entry.teamName,
        tasks: [],
      };
      bucket.tasks.push(entry);
      map.set(entry.requestId, bucket);
    }
    return [...map.entries()].map(([requestId, group]) => [
      requestId,
      {
        ...group,
        tasks: sortChecklistEntriesForRequest(group.tasks),
      },
    ] as const);
  }, [entries]);

  function completeTask(entry: CalendarTaskEntry) {
    setPendingTaskId(entry.task.id);
    startTransition(async () => {
      const res = await toggleNextActionTask(
        entry.requestId,
        entry.task.id,
        true,
      );
      setPendingTaskId(null);
      if (res.ok) {
        pulseTopBar();
        router.refresh();
      }
    });
  }

  return (
    <ul className="divide-y divide-line-default">
      {grouped.map(([requestId, group]) => (
        <li key={requestId} className="px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/app/requests/${requestId}`}
                className={cn(
                  uiTransition,
                  "block truncate text-sm font-medium text-fg-primary underline-offset-2 hover:underline",
                )}
              >
                {group.requestTitle}
              </Link>
              <p className="mt-1 text-xs leading-snug text-fg-tertiary">
                {formatRequestMeta(group)}
              </p>
            </div>
            <PriorityBadge
              priority={group.requestPriority}
              className="max-w-full shrink-0 truncate"
            />
          </div>
          <ul className="mt-2 space-y-1.5">
            {group.tasks.map((entry) => {
              const overdue = isCalendarTaskOverdue(entry.task);
              const busy = pending && pendingTaskId === entry.task.id;
              return (
                <li
                  key={entry.task.id}
                  className="flex items-start gap-2 rounded-[8px] border border-line-default/80 bg-canvas/50 px-2.5 py-2"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={busy}
                    onChange={() => completeTask(entry)}
                    aria-label={`Segna completato: ${entry.task.text}`}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line-default accent-accent"
                  />
                  <div className="min-w-0 flex-1">
                    <ExpandableChecklistTaskText text={entry.task.text} />
                    {entry.task.dueAt ? (
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] tabular-nums",
                          overdue ? "font-medium text-danger" : "text-fg-tertiary",
                        )}
                      >
                        Scadenza checklist: {formatDateTime(entry.task.dueAt)}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
