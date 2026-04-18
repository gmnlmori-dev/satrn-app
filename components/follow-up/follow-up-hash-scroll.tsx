"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Dopo navigazione con hash (es. da dashboard), scroll alla sezione corretta.
 * Ripete al paint perché il contenuto SSR può non essere ancora nel DOM.
 * `hashchange` copre anche il passaggio tra ancore sulla stessa pagina.
 */
export function FollowUpHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/app/follow-up") return;

    function scrollToHash() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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
