"use client";

import { createContext, useContext } from "react";

const CreateRequestContext = createContext<(() => void) | null>(null);

export function CreateRequestProvider({
  open,
  children,
}: {
  open: () => void;
  children: React.ReactNode;
}) {
  return (
    <CreateRequestContext.Provider value={open}>
      {children}
    </CreateRequestContext.Provider>
  );
}

export function useOpenCreateRequest(): () => void {
  const ctx = useContext(CreateRequestContext);
  if (!ctx) {
    return () => {};
  }
  return ctx;
}
