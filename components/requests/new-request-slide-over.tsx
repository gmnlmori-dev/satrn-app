"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NewRequestForm } from "@/components/requests/new-request-form";
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

/** Allineato a `TOP_BAR_H` in app-chrome (h-12) — non copre la top bar. */
const SLIDE_EASE = "duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]";

/**
 * Desktop: `left-0`, sotto la sidebar (z-index inferiore all’aside), larghezza w-56 + area contenuto
 * così il pannello è tutto visibile e il contenuto resta allineato con `md:pl-56`.
 * Mobile: padding coerente, slide da destra.
 */
export function NewRequestSlideOver({
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
      requestAnimationFrame(() => setEntered(true))
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
        "input:not([type=hidden]), select, textarea"
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
      {/* Solo area contenuto: sotto top bar (z-50) e a destra della sidebar (md+); z sotto chrome */}
      <button
        type="button"
        aria-label="Chiudi pannello"
        className={cn(
          slideOverBackdrop,
          "transition-opacity",
          SLIDE_EASE,
          "motion-reduce:transition-none",
          entered ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          "motion-reduce:pointer-events-auto motion-reduce:opacity-100"
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
          "motion-reduce:transition-none motion-reduce:translate-x-0",
          entered
            ? "translate-x-0"
            : "translate-x-full md:-translate-x-full"
        )}
      >
        <div className={slideOverInner}>
          <header className={slideOverHeader}>
            <div className="min-w-0 pr-2">
              <h2 id={titleId} className={slideOverTitle}>
                Nuova richiesta
              </h2>
              <p className={slideOverDescription}>
                Aggiungi alla coda operativa senza uscire dalla schermata corrente.
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

          <div className={slideOverBody}>
            <NewRequestForm
              onCancel={onClose}
              onSuccess={(requestId) => {
                onClose();
                router.push(`/app/requests/${requestId}`);
                router.refresh();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
