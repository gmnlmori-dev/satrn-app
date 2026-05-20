"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";
import {
  applyTheme,
  DEFAULT_THEME,
  getStoredTheme,
  setTheme,
  THEME_CHANGE_EVENT,
  type ThemeMode,
} from "@/lib/theme";
import { Panel } from "@/components/ui/panel";
import { uiSectionTitle } from "@/lib/typography";

const options: { value: ThemeMode; label: string; description: string }[] = [
  {
    value: "dark",
    label: "Scuro",
    description: "Interfaccia scura ad alto contrasto (predefinito).",
  },
  {
    value: "light",
    label: "Chiaro",
    description: "Sfondo chiaro con bordi e testo leggibili.",
  },
];

export function ThemePreferencePanel({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME);
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

  const select = useCallback((next: ThemeMode) => {
    setMode(next);
    setTheme(next);
  }, []);

  if (!mounted) {
    return (
      <Panel className={className}>
        <h2 className={uiSectionTitle}>Aspetto</h2>
        <p className="mt-1.5 text-sm text-fg-secondary">Caricamento preferenze…</p>
      </Panel>
    );
  }

  return (
    <Panel className={className}>
      <h2 className={uiSectionTitle}>Aspetto</h2>
      <p className="mt-1.5 text-sm text-fg-secondary">
        La scelta si applica all&apos;area autenticata e viene ricordata su questo
        browser. La pagina di accesso resta sempre scura.
      </p>
      <div
        role="radiogroup"
        aria-label="Tema interfaccia"
        className="mt-5 grid gap-2 sm:grid-cols-2"
      >
        {options.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(opt.value)}
              className={cn(
                uiTransition,
                "rounded-[10px] border px-4 py-3 text-left",
                active
                  ? "border-accent bg-accent-muted"
                  : "border-line-default bg-surface hover:bg-elevated",
              )}
            >
              <span className="block text-sm font-medium text-fg-primary">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-fg-secondary">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
