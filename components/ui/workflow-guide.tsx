"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const ITEMS = [
  {
    title: "Inbox",
    description: "Arriva qualcosa da valutare; non è ancora un caso strutturato.",
  },
  {
    title: "Progetto",
    description: "C'è un cliente o un caso con ciclo di vita, stato e priorità.",
  },
  {
    title: "Checklist in progetto",
    description: "Micro-passi operativi dentro un progetto già aperto.",
  },
  {
    title: "Task",
    description: "Azione interna o operativa senza contesto cliente.",
  },
] as const;

export function WorkflowHelpButton({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className={buttonClassName}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Quando usare cosa"
        title="Quando usare cosa"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold leading-none text-fg-tertiary">?</span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Quando usare cosa"
          className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-line-default bg-surface p-3 shadow-lg sm:w-80"
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
