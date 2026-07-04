"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { uiControl, uiTransition } from "@/lib/ui-classes";

export function isLongChecklistText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 88 || trimmed.includes("\n");
}

export function ExpandableChecklistTaskText({
  text,
  done = false,
  className,
  size = "xs",
}: {
  text: string;
  done?: boolean;
  className?: string;
  size?: "xs" | "sm";
}) {
  const [expanded, setExpanded] = useState(false);
  const long = isLongChecklistText(text);
  const textClass = size === "sm" ? "text-sm leading-snug" : "text-xs leading-snug";

  if (!long) {
    return (
      <p
        className={cn(
          textClass,
          "whitespace-pre-wrap break-words text-fg-primary",
          done && "text-fg-tertiary line-through",
          className,
        )}
      >
        {text}
      </p>
    );
  }

  return (
    <div className={className}>
      <p
        className={cn(
          textClass,
          "whitespace-pre-wrap break-words text-fg-primary",
          done && "text-fg-tertiary line-through",
          !expanded && "line-clamp-2",
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((value) => !value);
        }}
        className={cn(
          uiTransition,
          "mt-0.5 text-[11px] font-medium text-accent hover:text-accent/80",
        )}
      >
        {expanded ? "Comprimi" : "Espandi"}
      </button>
    </div>
  );
}

export function ExpandableChecklistTaskInput({
  value,
  onChange,
  disabled,
  done = false,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  done?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = isLongChecklistText(value);
  const showToggle = long || expanded;
  const rows = expanded
    ? Math.min(10, Math.max(4, value.split("\n").length + 1))
    : 2;

  return (
    <div className="min-w-0 flex-1">
      <textarea
        id={id}
        rows={rows}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          uiControl,
          "min-w-0 w-full py-2 text-[15px] leading-snug",
          expanded ? "resize-y" : "resize-none",
          done && "text-fg-tertiary line-through",
        )}
      />
      {showToggle ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            uiTransition,
            "mt-0.5 text-[11px] font-medium text-accent hover:text-accent/80 disabled:opacity-50",
          )}
        >
          {expanded ? "Comprimi" : "Espandi"}
        </button>
      ) : null}
    </div>
  );
}
