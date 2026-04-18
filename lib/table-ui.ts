import { cn } from "@/lib/cn";

/** Contenitore comune per tabelle dati (scroll orizzontale, bordo, sfondo). */
export const dataTableShellClass = cn(
  "w-full overflow-x-auto rounded-xl border border-slate-200/70 bg-white",
  "dark:border-slate-800 dark:bg-slate-900/40",
);

export const dataTableHeadRowClass = cn(
  "border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80",
);

export const dataTableThClass = cn(
  "px-4 py-3 text-left text-xs font-medium tracking-normal text-slate-500 sm:px-5 dark:text-slate-400",
);

export const dataTableColSepClass = cn(
  "border-l border-slate-200/60 dark:border-slate-800/75",
);
