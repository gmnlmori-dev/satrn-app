"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { uiBtnGhost } from "@/lib/ui-classes";

const STORAGE_KEY = "satrn-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isLight = stored === "light";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("dark", !isLight);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document.documentElement.classList.toggle("dark", !next);
    localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(uiBtnGhost, "px-2 py-1.5 text-xs", className)}
      aria-label={light ? "Attiva tema scuro" : "Attiva tema chiaro"}
    >
      {light ? "Scuro" : "Chiaro"}
    </button>
  );
}
