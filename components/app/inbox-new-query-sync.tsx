"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Apre il pannello Nuovo inbox quando l’URL è `/app/inbox?nuova=1`. */
export function InboxNewQuerySync({ onOpen }: { onOpen: () => void }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("nuova") !== "1") return;
    onOpen();
    router.replace(pathname ?? "/app/inbox", { scroll: false });
  }, [searchParams, pathname, router, onOpen]);

  return null;
}
