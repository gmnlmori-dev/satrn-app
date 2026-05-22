"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollAppMainToElement } from "@/lib/main-scroll";

/**
 * Dopo navigazione con hash (es. da dashboard), scroll alla sezione corretta
 * dentro `<main>`, non sulla window (layout app a scroll interno).
 */
export function FollowUpHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/app/follow-up") return;

    function scrollToHash() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      scrollAppMainToElement(id, { behavior: "instant" });
    }

    scrollToHash();
    const t = window.setTimeout(scrollToHash, 80);
    const t2 = window.setTimeout(scrollToHash, 320);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}
