"use client";

import { useEffect } from "react";
import type { Request } from "@/types/request";
import { cn } from "@/lib/cn";
import { formatCalendarDay } from "@/lib/date";
import { uiBtnGhost, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";
import { RequestsCalendarEvent } from "@/components/requests/requests-calendar-event";

export function RequestsCalendarDayPanel({
  date,
  requests,
  onClose,
  onRequestSelect,
}: {
  date: Date;
  requests: Request[];
  onClose: () => void;
  onRequestSelect: (request: Request) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi elenco giorno"
        className="fixed inset-0 z-40 bg-canvas/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-day-panel-title"
        className={cn(
          uiCard,
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(24rem,80vh)] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-[var(--shadow-surface)]",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-default px-4 py-3">
          <div className="min-w-0">
            <h3
              id="cal-day-panel-title"
              className="text-sm font-semibold text-fg-primary"
            >
              {formatCalendarDay(date)}
            </h3>
            <p className="mt-0.5 text-xs text-fg-secondary">
              {requests.length}{" "}
              {requests.length === 1 ? "scadenza" : "scadenze"}
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
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          {requests.map((r) => (
            <li key={r.id}>
              <RequestsCalendarEvent request={r} onSelect={onRequestSelect} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
