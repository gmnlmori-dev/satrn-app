"use client";

import { createContext, useContext } from "react";

const CreateTaskContext = createContext<(() => void) | null>(null);

export function CreateTaskProvider({
  open,
  children,
}: {
  open: () => void;
  children: React.ReactNode;
}) {
  return (
    <CreateTaskContext.Provider value={open}>{children}</CreateTaskContext.Provider>
  );
}

export function useOpenCreateTask(): () => void {
  const ctx = useContext(CreateTaskContext);
  if (!ctx) {
    return () => {};
  }
  return ctx;
}
