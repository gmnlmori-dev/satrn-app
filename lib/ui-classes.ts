import { cn } from "@/lib/cn";

export const uiTransition = "transition-colors duration-150";

export const uiFocusRingInset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50";

export const uiFocusRingOffset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

export const uiControl = cn(
  uiTransition,
  "w-full min-w-0 rounded-[10px] border border-line-default bg-field px-3 py-2 text-sm text-fg-primary",
  "placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40",
);

/** Input date/time — icona calendario invertita in tema scuro via globals.css */
export const uiDateControl = cn(
  uiControl,
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80",
);

export const uiBtnPrimary = cn(
  uiTransition,
  uiFocusRingOffset,
  "inline-flex items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-accent-fg",
  "hover:brightness-110 active:brightness-95",
  "disabled:cursor-not-allowed disabled:opacity-40",
  "aria-busy:cursor-wait aria-busy:opacity-80",
);

export const uiBtnSecondary = cn(
  uiTransition,
  uiFocusRingOffset,
  "inline-flex items-center justify-center rounded-[10px] border border-line-default bg-surface px-3 py-2 text-sm font-medium text-fg-primary",
  "hover:bg-elevated active:bg-surface",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:text-fg-tertiary",
);

export const uiBtnGhost = cn(
  uiTransition,
  uiFocusRingInset,
  "inline-flex items-center justify-center rounded-[10px] px-3 py-2 text-sm font-medium text-fg-secondary",
  "hover:bg-elevated hover:text-fg-primary",
  "disabled:cursor-not-allowed disabled:text-fg-tertiary",
);

export const uiBtnIcon = cn(
  uiTransition,
  uiFocusRingInset,
  "inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-line-default bg-surface text-fg-secondary",
  "hover:bg-elevated hover:text-fg-primary",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

export const uiBtnDanger = cn(
  uiTransition,
  uiFocusRingOffset,
  "inline-flex items-center justify-center rounded-[10px] border border-danger/40 bg-danger-muted px-3 py-2 text-sm font-medium text-danger",
  "hover:brightness-110",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

export const uiNavActive = cn(
  uiTransition,
  uiFocusRingInset,
  "flex h-9 items-center gap-2.5 rounded-md bg-elevated px-2.5 text-[13px] font-medium text-fg-primary",
);

export const uiNavItem = cn(
  uiTransition,
  uiFocusRingInset,
  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-fg-secondary",
  "hover:bg-elevated hover:text-fg-primary",
);

export const uiLink = cn(
  uiTransition,
  "text-accent underline-offset-2 hover:underline",
);

/** Layout condiviso slide-over (Nuova richiesta, Nuovo inbox, Nuovo utente, …). */
export const slideOverPanel = cn(
  "fixed bottom-0 left-0 flex flex-col overflow-hidden border-r border-line-default bg-surface shadow-[var(--shadow-surface)]",
  "top-12",
  "z-[55] w-full max-w-xl md:z-[45] md:max-w-none md:w-[min(51.25rem,100vw)]",
);

export const slideOverBackdrop = cn(
  "fixed bottom-0 right-0 z-40 top-12 left-0 md:left-52 bg-canvas/70",
);

export const slideOverInner = cn(
  "flex min-h-0 flex-1 flex-col pl-5 pr-4 sm:pr-5 md:pl-[calc(14rem+1.25rem)]",
);

/** Header allineato al contenuto form (senza px extra). */
export const slideOverHeader = cn(
  "flex shrink-0 items-start justify-between gap-3 border-b border-line-default py-3.5 sm:py-4",
);

export const slideOverBody = cn(
  "flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pt-4",
);

export const slideOverTitle = cn(
  "text-lg font-semibold tracking-tight text-fg-primary",
);

export const slideOverDescription = cn(
  "mt-1 max-w-lg text-sm leading-relaxed text-fg-secondary",
);

/** Campi filtro toolbar — flex wrap, larghezze minime per evitare troncamento select. */
export const uiFilterFieldsRow = cn("flex w-full flex-wrap items-end gap-4");

export const uiFilterField = cn(
  "flex w-full min-w-[min(100%,11.5rem)] flex-1 flex-col sm:w-auto sm:max-w-[15rem]",
);

export const uiFilterFieldWide = cn(
  "flex w-full min-w-[min(100%,15rem)] flex-1 flex-col sm:w-auto sm:max-w-[20rem]",
);

export const uiFilterFieldSort = cn(
  "flex w-full min-w-[min(100%,17rem)] flex-1 flex-col sm:w-auto sm:max-w-[22rem]",
);

export const uiFilterSelect = cn(uiControl, "max-w-none");
