"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { uiBtnGhost, uiBtnIcon, uiTransition } from "@/lib/ui-classes";

const ITEMS = [
  {
    title: "Inbox",
    description: "Arriva qualcosa da valutare; non è ancora un caso strutturato.",
  },
  {
    title: "Richiesta",
    description: "C'è un cliente o un caso con ciclo di vita, stato e priorità.",
  },
  {
    title: "Checklist in richiesta",
    description: "Micro-passi operativi dentro una richiesta già aperta.",
  },
  {
    title: "Task",
    description: "Azione interna o operativa senza contesto cliente.",
  },
] as const;

export function WorkflowHelpTip({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className={cn(uiBtnIcon, "h-8 w-8 text-xs font-semibold text-fg-tertiary")}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Guida: quando usare Inbox, Richiesta, Checklist e Task"
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-line-default bg-surface p-3 shadow-lg sm:w-80"
        >
          <p className="text-xs font-semibold text-fg-primary">Quando usare cosa</p>
          <dl className="mt-2 space-y-2">
            {ITEMS.map((item) => (
              <div key={item.title}>
                <dt className="text-xs font-medium text-fg-secondary">{item.title}</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-fg-tertiary">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export function WorkflowGuide({
  className,
  defaultOpen = false,
}: {
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-lg border border-line-default bg-elevated/40", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          uiTransition,
          uiBtnGhost,
          "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-fg-secondary",
        )}
        aria-expanded={open}
      >
        <span>Quando usare cosa</span>
        <svg
          className={cn(
            "h-4 w-4 shrink-0 text-fg-tertiary transition-transform",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open ? (
        <dl className="grid gap-2 border-t border-line-default px-3 py-3 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div key={item.title}>
              <dt className="text-xs font-semibold text-fg-primary">{item.title}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-fg-tertiary">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
