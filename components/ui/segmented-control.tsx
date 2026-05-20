"use client";

import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-[10px] border border-line-default bg-canvas p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              uiTransition,
              uiFocusRingInset,
              "rounded-[8px] px-3 py-1.5 text-[13px] font-medium",
              active
                ? "bg-surface text-fg-primary shadow-sm"
                : "text-fg-secondary hover:text-fg-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
