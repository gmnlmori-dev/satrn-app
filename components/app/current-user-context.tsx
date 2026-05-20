"use client";

import type { ProfileSummary } from "@/types/profile";
import { createContext, useContext } from "react";

const CurrentUserContext = createContext<ProfileSummary | null>(null);

export function CurrentUserProvider({
  profile,
  children,
}: {
  profile: ProfileSummary | null;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={profile}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useOptionalCurrentProfile(): ProfileSummary | null {
  return useContext(CurrentUserContext);
}
