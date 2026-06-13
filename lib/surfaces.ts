import { cn } from "@/lib/cn";

export const uiCard = cn(
  "rounded-[12px] border border-line-default bg-surface",
);

export const uiCardElevated = cn(
  "rounded-[12px] border border-line-strong bg-surface shadow-[var(--shadow-surface)]",
);

/** Card/toolbar shell (alias of uiCard). */
export const uiPanel = uiCard;
