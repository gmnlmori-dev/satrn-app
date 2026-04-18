"use client";

import { createContext, useContext } from "react";

const InboxSlideContext = createContext<(() => void) | null>(null);

export function InboxSlideProvider({
  open,
  children,
}: {
  open: () => void;
  children: React.ReactNode;
}) {
  return (
    <InboxSlideContext.Provider value={open}>
      {children}
    </InboxSlideContext.Provider>
  );
}

export function useOpenInboxSlide(): () => void {
  const ctx = useContext(InboxSlideContext);
  if (!ctx) return () => {};
  return ctx;
}
