import { cn } from "@/lib/cn";

/**
 * Token UI condivisi (focus, transizioni leggere). Usare con cn().
 */
export const uiTransition = "transition-colors duration-150";

export const uiFocusRingInset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/12 dark:focus-visible:ring-slate-100/15";

export const uiFocusRingOffset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-300/25 dark:focus-visible:ring-offset-slate-950";

/** CTA principale: resta nettamente più forte del secondario. */
export const uiBtnPrimary = cn(
  uiTransition,
  uiFocusRingOffset,
  "rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold leading-snug text-white shadow-sm",
  "hover:bg-slate-800",
  "dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
  "disabled:cursor-not-allowed disabled:opacity-[0.42] disabled:shadow-none",
  "disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-100",
  "aria-busy:cursor-wait aria-busy:opacity-[0.88]"
);

/**
 * Azione secondaria con bordo: deve risultare chiaramente cliccabile, non “spenta”.
 * Usare con `disabled` per stato non disponibile (colori espliciti, no solo opacity).
 */
export const uiBtnSecondary = cn(
  uiTransition,
  uiFocusRingOffset,
  "rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold leading-snug text-slate-800 shadow-sm",
  "hover:border-slate-400 hover:bg-slate-50",
  "active:bg-slate-100/90",
  "dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100",
  "dark:hover:border-slate-400 dark:hover:bg-slate-800",
  "dark:active:bg-slate-800",
  "disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
  "disabled:hover:border-slate-200 disabled:hover:bg-slate-100",
  "dark:disabled:border-slate-800 dark:disabled:bg-slate-950 dark:disabled:text-slate-600",
  "dark:disabled:hover:border-slate-800 dark:disabled:hover:bg-slate-950",
  "aria-busy:cursor-wait aria-busy:border-slate-400 dark:aria-busy:border-slate-400"
);

/**
 * Azione terziaria (Annulla inline, testo + hover): più definita del solo link grigio.
 */
export const uiBtnGhost = cn(
  uiTransition,
  uiFocusRingInset,
  "rounded-md border border-transparent bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-800",
  "hover:border-slate-200 hover:bg-slate-50",
  "dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/90",
  "disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-transparent disabled:hover:bg-transparent",
  "dark:disabled:text-slate-600 dark:disabled:hover:bg-transparent"
);

/** Pulsanti solo icona (menu, chiudi): stesso linguaggio del secondario, formato compatto. */
export const uiBtnIcon = cn(
  uiTransition,
  uiFocusRingInset,
  "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-800 shadow-sm",
  "hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900",
  "active:bg-slate-100/90",
  "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200",
  "dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-50",
  "disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100",
  "disabled:hover:bg-slate-100 dark:disabled:border-slate-800 dark:disabled:bg-slate-950 dark:disabled:text-slate-600"
);
