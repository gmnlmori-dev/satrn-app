import { cn } from "@/lib/cn";

export const dataTableShellClass = cn(
  "w-full overflow-x-auto rounded-lg border border-border-subtle bg-panel",
);

export const dataTableHeadRowClass = cn(
  "border-b border-border-subtle bg-inset",
);

export const dataTableThClass = cn(
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted sm:px-5",
);

export const dataTableColSepClass = cn(
  "border-l border-border-subtle",
);

export const dataTableRowClass = cn(
  "border-b border-border-subtle transition-colors last:border-b-0",
  "hover:bg-panel-hover",
);

export const dataTableTdClass = cn(
  "px-4 py-2.5 align-middle text-sm text-primary sm:px-5",
);
