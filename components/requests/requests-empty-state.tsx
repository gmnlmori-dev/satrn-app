"use client";

import { cn } from "@/lib/cn";
import { uiBtnSecondary } from "@/lib/ui-classes";

/** Nessuna riga in tabella (non dipende dai filtri). */
export function RequestsDatabaseEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 px-6 py-12 text-center dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 11v6M9 14h6M16 19h6"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-slate-900 dark:text-slate-100">
        Nessuna richiesta
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Non ci sono ancora record nel database. La creazione da interfaccia arriverà
        in un secondo momento.
      </p>
    </div>
  );
}

export function RequestsEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 px-6 py-12 text-center dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-slate-900 dark:text-slate-100">
        Nessun risultato con i filtri attuali
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Prova a cambiare la ricerca o apri i filtri e reimposta.
      </p>
      <button
        type="button"
        onClick={onReset}
        className={cn(uiBtnSecondary, "mt-6 px-4 py-2.5")}
      >
        Reimposta filtri
      </button>
    </div>
  );
}
