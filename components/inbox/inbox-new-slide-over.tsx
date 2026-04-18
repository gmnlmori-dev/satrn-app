"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InboxNewForm } from "@/components/inbox/inbox-new-form";
import { cn } from "@/lib/cn";
import { uiBtnIcon } from "@/lib/ui-classes";

const BELOW_TOP_BAR = "top-12";
const SLIDE_EASE = "duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]";

export function InboxNewSlideOver({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
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
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea",
      )?.focus();
    }, 220);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi pannello"
        className={cn(
          "fixed bottom-0 right-0 z-40",
          BELOW_TOP_BAR,
          "left-0 md:left-56",
          "bg-gradient-to-r from-slate-900/5 via-slate-900/12 to-slate-900/20",
          "dark:from-slate-950/18 dark:via-slate-950/28 dark:to-slate-950/38",
          "transition-opacity",
          SLIDE_EASE,
          "motion-reduce:transition-none",
          entered
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
          "motion-reduce:pointer-events-auto motion-reduce:opacity-100",
        )}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed bottom-0 left-0 flex flex-col overflow-hidden border-r border-slate-200/90 bg-white shadow-[8px_0_40px_rgba(15,23,42,0.1)]",
          BELOW_TOP_BAR,
          "z-[55] w-full max-w-xl md:z-[45] md:max-w-none md:w-[min(51.25rem,100vw)]",
          "dark:border-slate-800 dark:bg-slate-900 dark:shadow-[8px_0_40px_rgba(0,0,0,0.35)]",
          "transition-transform",
          SLIDE_EASE,
          "motion-reduce:transition-none motion-reduce:translate-x-0",
          entered
            ? "translate-x-0"
            : "translate-x-full md:-translate-x-full",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col pl-5 pr-4 sm:pr-5 md:pl-[calc(14rem+1.25rem)]">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/90 py-3.5 sm:py-4 dark:border-slate-800">
            <div className="min-w-0 pr-2">
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
              >
                Nuovo inbox
              </h2>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Registra un ingresso grezzo senza uscire dalla schermata corrente.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(uiBtnIcon, "shrink-0 p-2")}
              aria-label="Chiudi"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pt-4">
            <InboxNewForm
              variant="sheet"
              onCancel={onClose}
              onSuccess={(id) => {
                onClose();
                router.push(`/app/inbox/${id}`);
                router.refresh();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
