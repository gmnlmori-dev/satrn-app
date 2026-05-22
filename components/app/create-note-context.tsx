"use client";

import { createContext, useContext } from "react";

const CreateNoteContext = createContext<(() => void) | null>(null);

export function CreateNoteProvider({
  open,
  children,
}: {
  open: () => void;
  children: React.ReactNode;
}) {
  return (
    <CreateNoteContext.Provider value={open}>{children}</CreateNoteContext.Provider>
  );
}

export function useOpenCreateNote(): () => void {
  const ctx = useContext(CreateNoteContext);
  if (!ctx) {
    return () => {};
  }
  return ctx;
}
