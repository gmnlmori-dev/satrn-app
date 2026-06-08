"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { cn } from "@/lib/cn";
import {
  slideOverBackdrop,
  slideOverBody,
  slideOverDescription,
  slideOverHeader,
  slideOverInner,
  slideOverPanel,
  slideOverTitle,
  uiBtnIcon,
} from "@/lib/ui-classes";
import type { Task } from "@/types/task";

const SLIDE_EASE = "duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]";

export function TaskEditSlideOver({
  task,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: Task | null;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}) {
  const open = task !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true)),
    );
    return () => {
      cancelAnimationFrame(id);
      queueMicrotask(() => setEntered(false));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi pannello"
        className={cn(
          slideOverBackdrop,
          "transition-opacity",
          SLIDE_EASE,
          "motion-reduce:transition-none",
          entered ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          slideOverPanel,
          "transition-transform",
          SLIDE_EASE,
          "motion-reduce:transition-none",
          entered ? "translate-x-0" : "-translate-x-full md:-translate-x-[105%]",
        )}
      >
        <div className={slideOverInner}>
          <header className={slideOverHeader}>
            <div>
              <h2 id={titleId} className={slideOverTitle}>
                Modifica task
              </h2>
              <p className={slideOverDescription}>
                Aggiorna titolo, scadenza o assegnazione.
              </p>
            </div>
            <button
              type="button"
              className={uiBtnIcon}
              aria-label="Chiudi"
              onClick={onClose}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className={slideOverBody}>
            <TaskEditForm
              key={task.id}
              task={task}
              onSuccess={(updated) => {
                onUpdated(updated);
                onClose();
              }}
              onCancel={onClose}
              onDeleted={(taskId) => {
                onDeleted(taskId);
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
