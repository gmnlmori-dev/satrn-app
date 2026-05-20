export const THEME_STORAGE_KEY = "satrn-theme";

export type ThemeMode = "light" | "dark";

export const DEFAULT_THEME: ThemeMode = "dark";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", mode === "light");
  root.classList.toggle("dark", mode === "dark");
}

export const THEME_CHANGE_EVENT = "satrn-theme-change";

export function setTheme(mode: ThemeMode): void {
  applyTheme(mode);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage bloccato */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: mode }),
    );
  }
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getStoredTheme() === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

/** IIFE string per script inline anti-FOUC (prima del paint). */
export const themeInitScript = `(function(){try{var k="satrn-theme";var s=localStorage.getItem(k);var light=s==="light";var r=document.documentElement;r.classList.toggle("light",light);r.classList.toggle("dark",!light);}catch(e){document.documentElement.classList.add("dark");}})();`;
