"use client";

import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";
import { createContext, useContext } from "react";

type CurrentUserContextValue = {
  profile: ProfileSummary | null;
  /** Team attivi per select creazione (solo admin; altrimenti []). */
  teamsForCreate: TeamSelectOption[];
  /** Inbox abilitata globalmente dall'admin. */
  inboxEnabled: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  profile: null,
  teamsForCreate: [],
  inboxEnabled: false,
});

export function CurrentUserProvider({
  profile,
  teamsForCreate = [],
  inboxEnabled = false,
  children,
}: {
  profile: ProfileSummary | null;
  teamsForCreate?: TeamSelectOption[];
  inboxEnabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider
      value={{ profile, teamsForCreate, inboxEnabled }}
    >
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

export function useInboxEnabled(): boolean {
  return useContext(CurrentUserContext).inboxEnabled;
}
