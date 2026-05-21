"use client";

import { useCallback, useState } from "react";
import { AdminTeamCreateSheet } from "@/components/settings/admin-team-create-sheet";
import { AdminTeamEditSheet } from "@/components/settings/admin-team-edit-sheet";
import {
  useAppSlideCoordinator,
  useExclusiveAppSlide,
  useRegisterAppSlideClose,
} from "@/components/app/app-slide-coordinator";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import {
  dataTableHeadRowClass,
  dataTableShellClass,
  dataTableTdClass,
} from "@/lib/table-ui";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { TeamSummary } from "@/types/team";

export function AdminTeamsTable({ teams }: { teams: TeamSummary[] }) {
  const [editTeam, setEditTeam] = useState<TeamSummary | null>(null);
  const { openExclusive } = useAppSlideCoordinator();
  const createSlide = useExclusiveAppSlide("admin-team-create");

  const closeEdit = useCallback(() => setEditTeam(null), []);
  useRegisterAppSlideClose("admin-team-edit", closeEdit);

  const openEdit = useCallback(
    (team: TeamSummary) => {
      openExclusive("admin-team-edit", () => setEditTeam(team));
    },
    [openExclusive],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className={uiPageTitle}>Team</h1>
          <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
            Organizza utenti, richieste e inbox per team. Solo gli admin
            gestiscono questo elenco.
          </p>
        </div>
        <button
          type="button"
          className={cn(uiBtnPrimary, "shrink-0 self-start")}
          onClick={createSlide.openSlide}
        >
          Nuovo team
        </button>
      </header>

      <div className={dataTableShellClass}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className={dataTableHeadRowClass}>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  className="w-[10rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5"
                >
                  Slug
                </th>
                <th
                  scope="col"
                  className="w-[7rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5"
                >
                  Stato
                </th>
                <th
                  scope="col"
                  className="w-[7rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5"
                >
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-default">
              {teams.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-fg-tertiary md:px-5"
                  >
                    Nessun team. Crea il primo con «Nuovo team».
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id}>
                    <td className={cn(dataTableTdClass, "font-medium")}>
                      {t.name}
                    </td>
                    <td
                      className={cn(
                        dataTableTdClass,
                        "font-mono text-xs text-fg-secondary",
                      )}
                    >
                      {t.slug}
                    </td>
                    <td className={dataTableTdClass}>
                      <span
                        className={cn(
                          "text-sm",
                          t.isActive ? "text-success" : "text-fg-tertiary",
                        )}
                      >
                        {t.isActive ? "Attivo" : "Disattivato"}
                      </span>
                    </td>
                    <td className={dataTableTdClass}>
                      <button
                        type="button"
                        className={cn(uiBtnSecondary, "px-2.5 py-1 text-xs")}
                        onClick={() => openEdit(t)}
                      >
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminTeamCreateSheet
        open={createSlide.open}
        onClose={createSlide.closeSlide}
      />
      <AdminTeamEditSheet
        open={editTeam !== null}
        team={editTeam}
        onClose={() => setEditTeam(null)}
      />
    </div>
  );
}
