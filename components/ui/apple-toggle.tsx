"use client";

import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";

export function AppleToggle({
  checked,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        uiTransition,
        uiFocusRingOffset,
        "relative inline-flex h-7 w-12 shrink-0 rounded-full p-0.5",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-fg-tertiary/25",
      )}
    >
      <span
        aria-hidden
        className={cn(
          uiTransition,
          "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.28)]",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
