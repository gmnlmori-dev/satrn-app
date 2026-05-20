"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { uiBtnGhost } from "@/lib/ui-classes";
import {
  applyTheme,
  getStoredTheme,
  THEME_CHANGE_EVENT,
  toggleTheme,
  type ThemeMode,
} from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    setMode(stored);
    applyTheme(stored);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ThemeMode>).detail;
      if (detail) setMode(detail);
    };
    window.addEventListener(THEME_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  }, []);

  const onToggle = useCallback(() => {
    const next = toggleTheme();
    setMode(next);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={cn(uiBtnGhost, "shrink-0 px-2 py-1.5 text-xs opacity-50", className)}
      >
        Tema…
      </button>
    );
  }

  const isLight = mode === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(uiBtnGhost, "shrink-0 gap-1.5 px-2 py-1.5 text-xs", className)}
      aria-pressed={isLight}
      aria-label={isLight ? "Passa al tema scuro" : "Passa al tema chiaro"}
    >
      {isLight ? (
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      )}
      {isLight ? "Scuro" : "Chiaro"}
    </button>
  );
}
