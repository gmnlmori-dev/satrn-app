"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";
import { uiSectionTitle } from "@/lib/typography";

export function DashboardSecondaryFeed({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-4" aria-label="Timeline e attività recenti">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          uiCard,
          uiTransition,
          uiFocusRingInset,
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5",
          "hover:bg-elevated",
        )}
      >
        <div className="min-w-0">
          <span className={uiSectionTitle}>Timeline e attività recenti</span>
          <p className="mt-0.5 text-sm text-fg-secondary">
            {open
              ? "Nascondi il dettaglio cronologico."
              : "Apri per consultare timeline e richieste aggiornate."}
          </p>
        </div>
        <svg
          className={cn(
            "h-5 w-5 shrink-0 text-fg-tertiary transition-transform",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {open ? (
        <div className="grid gap-5 lg:grid-cols-2">{children}</div>
      ) : null}
    </section>
  );
}
