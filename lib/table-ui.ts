import { cn } from "@/lib/cn";

export const dataTableShellClass = cn(
  "w-full overflow-x-auto rounded-[12px] border border-line-default bg-surface",
);

export const dataTableHeadRowClass = cn(
  "border-b border-line-strong bg-canvas",
);

export const dataTableThClass = cn(
  "px-4 py-2.5 text-left text-[11px] font-semibold text-fg-secondary sm:px-5",
);

export const dataTableColSepClass = cn("border-l border-line-default");

export const dataTableRowClass = cn(
  "border-b border-line-default transition-colors last:border-b-0 hover:bg-elevated",
);

export const dataTableTdClass = cn(
  "px-4 py-2.5 align-middle text-sm text-fg-primary sm:px-5",
);
