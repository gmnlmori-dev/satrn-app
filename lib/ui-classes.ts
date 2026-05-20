import { cn } from "@/lib/cn";

export const uiTransition = "transition-colors duration-150";

export const uiFocusRingInset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-focus";

export const uiFocusRingOffset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app";

export const uiControl = cn(
  uiTransition,
  "w-full min-w-0 rounded-md border border-border-default bg-inset px-3 py-2 text-sm leading-snug text-primary",
  "placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring-focus",
);

export const uiBtnPrimary = cn(
  uiTransition,
  uiFocusRingOffset,
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold leading-snug text-app shadow-sm",
  "hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
  "aria-busy:cursor-wait aria-busy:opacity-85",
);

export const uiBtnSecondary = cn(
  uiTransition,
  uiFocusRingOffset,
  "rounded-md border border-border-default bg-panel px-3 py-2 text-sm font-semibold leading-snug text-primary shadow-sm",
  "hover:border-border-default hover:bg-panel-hover",
  "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-inset disabled:text-muted disabled:shadow-none",
  "aria-busy:cursor-wait",
);

export const uiBtnGhost = cn(
  uiTransition,
  uiFocusRingInset,
  "rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-semibold text-secondary",
  "hover:border-border-subtle hover:bg-panel-hover hover:text-primary",
  "disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-transparent disabled:hover:bg-transparent",
);

export const uiBtnIcon = cn(
  uiTransition,
  uiFocusRingInset,
  "inline-flex items-center justify-center rounded-md border border-border-default bg-panel text-secondary shadow-sm",
  "hover:border-border-default hover:bg-panel-hover hover:text-primary",
  "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-inset disabled:text-muted",
);

export const uiBtnDanger = cn(
  uiTransition,
  uiFocusRingOffset,
  "rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm font-semibold text-danger",
  "hover:bg-danger/20",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

export const uiNavActive = cn(
  "relative bg-accent-muted text-primary",
  "before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent",
);

export const uiNavItem = cn(
  uiTransition,
  uiFocusRingInset,
  "inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-secondary",
  "hover:bg-panel-hover hover:text-primary",
);
