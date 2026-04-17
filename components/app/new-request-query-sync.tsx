"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function NewRequestQuerySync({ onOpen }: { onOpen: () => void }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("nuova") !== "1") return;
    onOpen();
    router.replace(pathname ?? "/app/requests", { scroll: false });
  }, [searchParams, pathname, router, onOpen]);

  return null;
}
