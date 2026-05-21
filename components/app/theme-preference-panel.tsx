"use client";

import { useCallback, useEffect, useState } from "react";
import { AppleToggle } from "@/components/ui/apple-toggle";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";
import {
  applyTheme,
  DEFAULT_THEME,
  getStoredTheme,
  setTheme,
  THEME_CHANGE_EVENT,
  type ThemeMode,
} from "@/lib/theme";

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

  const onToggle = useCallback((light: boolean) => {
    const next: ThemeMode = light ? "light" : "dark";
    setMode(next);
    setTheme(next);
  }, []);

  const isLight = mode === "light";

  return (
    <SettingsGroup
      className={className}
      title="Aspetto"
      footer="La scelta vale su questo browser, inclusa la pagina di accesso."
    >
      <SettingsRow
        label="Tema chiaro"
        description="Sfondo chiaro al posto del tema scuro predefinito."
        disabled={!mounted}
        control={
          <AppleToggle
            checked={mounted ? isLight : false}
            disabled={!mounted}
            onChange={onToggle}
            aria-label="Attiva tema chiaro"
          />
        }
      />
    </SettingsGroup>
  );
}
