"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { uiControl, uiTransition } from "@/lib/ui-classes";

function useOverflowsTwoLines(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: unknown[],
) {
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) {
      setOverflows(false);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const check = () => {
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, ref, ...deps]);

  return overflows;
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
  const textRef = useRef<HTMLParagraphElement>(null);
  const overflows = useOverflowsTwoLines(textRef, !expanded, [text]);
  const showToggle = overflows || expanded;
  const textClass = size === "sm" ? "text-sm leading-snug" : "text-xs leading-snug";

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={cn(
          textClass,
          "whitespace-pre-wrap break-words text-fg-primary",
          done && "text-fg-tertiary line-through",
          !expanded && "line-clamp-2",
        )}
      >
        {text}
      </p>
      {showToggle ? (
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
      ) : null}
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const overflows = useOverflowsTwoLines(inputRef, !expanded, [value]);
  const showToggle = overflows || expanded;
  const rows = expanded
    ? Math.min(10, Math.max(4, value.split("\n").length + 1))
    : 2;

  return (
    <div className="min-w-0 flex-1">
      <textarea
        ref={inputRef}
        id={id}
        rows={rows}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          uiControl,
          "min-w-0 w-full py-2 text-[15px] leading-snug",
          expanded ? "resize-y" : "resize-none overflow-hidden",
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
