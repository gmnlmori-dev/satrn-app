"use client";

import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";
import type { TeamTag } from "@/types/tag";
import { createContext, useContext, useMemo } from "react";
import { tagsForTeam } from "@/lib/tags";

type CurrentUserContextValue = {
  profile: ProfileSummary | null;
  /** Team attivi per select creazione (solo admin; altrimenti []). */
  teamsForCreate: TeamSelectOption[];
  /** Inbox abilitata globalmente dall'admin. */
  inboxEnabled: boolean;
  /**
   * Catalogo tag visibili all'utente: il proprio team (o tutti i team per
   * l'admin). Usato dai form di creazione nei slide-over globali.
   */
  teamTags: TeamTag[];
  /** userId → chiave avatar dei membri visibili (solo chi ha un'immagine). */
  memberAvatars: Record<string, string>;
};

const EMPTY_AVATARS: Record<string, string> = {};

const CurrentUserContext = createContext<CurrentUserContextValue>({
  profile: null,
  teamsForCreate: [],
  inboxEnabled: false,
  teamTags: [],
  memberAvatars: EMPTY_AVATARS,
});

export function CurrentUserProvider({
  profile,
  teamsForCreate = [],
  inboxEnabled = false,
  teamTags = [],
  memberAvatars = EMPTY_AVATARS,
  children,
}: {
  profile: ProfileSummary | null;
  teamsForCreate?: TeamSelectOption[];
  inboxEnabled?: boolean;
  teamTags?: TeamTag[];
  memberAvatars?: Record<string, string>;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ profile, teamsForCreate, inboxEnabled, teamTags, memberAvatars }),
    [profile, teamsForCreate, inboxEnabled, teamTags, memberAvatars],
  );
  return (
    <CurrentUserContext.Provider value={value}>
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

/**
 * Chiave avatar di un membro (o dell'utente corrente, che ha la precedenza
 * dal profilo caricato). `null` se nessuna immagine impostata.
 */
export function useMemberAvatarKey(userId: string | null | undefined): string | null {
  const { memberAvatars, profile } = useContext(CurrentUserContext);
  if (!userId) return null;
  if (profile && profile.userId === userId) return profile.avatarKey;
  return memberAvatars[userId] ?? null;
}

/**
 * Tag di team disponibili lato client.
 * - `teamId` stringa: filtra su quel team (es. admin che cambia team nel form).
 * - `undefined`: team dell'utente corrente.
 * - `null`: nessun filtro (tutto il catalogo visibile, utile per elenchi
 *   multi-team dell'admin).
 */
export function useTeamTags(teamId?: string | null): TeamTag[] {
  const { teamTags, profile } = useContext(CurrentUserContext);
  const resolvedTeamId =
    teamId === null ? null : (teamId || profile?.teamId || null);
  return useMemo(
    () => tagsForTeam(teamTags, resolvedTeamId),
    [teamTags, resolvedTeamId],
  );
}
