"use client";

import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";
import { createContext, useContext } from "react";

type CurrentUserContextValue = {
  profile: ProfileSummary | null;
  /** Team attivi per select creazione (solo admin; altrimenti []). */
  teamsForCreate: TeamSelectOption[];
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  profile: null,
  teamsForCreate: [],
});

export function CurrentUserProvider({
  profile,
  teamsForCreate = [],
  children,
}: {
  profile: ProfileSummary | null;
  teamsForCreate?: TeamSelectOption[];
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={{ profile, teamsForCreate }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useOptionalCurrentProfile(): ProfileSummary | null {
  return useContext(CurrentUserContext).profile;
}

export function useTeamsForCreate(): TeamSelectOption[] {
  return useContext(CurrentUserContext).teamsForCreate;
}
