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
  "relative flex items-center gap-2 rounded-[8px] bg-accent-subtle pl-3 pr-2.5 text-fg-primary",
  "before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-accent",
);

export const uiNavItem = cn(
  uiTransition,
  uiFocusRingInset,
  "flex h-9 items-center gap-2 rounded-[8px] px-2.5 text-[13px] font-medium text-fg-secondary",
  "hover:bg-elevated hover:text-fg-primary",
);

export const uiLink = cn(
  uiTransition,
  "text-accent underline-offset-2 hover:underline",
);
