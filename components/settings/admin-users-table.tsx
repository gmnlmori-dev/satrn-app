"use client";

import { useCallback, useState } from "react";
import { AdminUserCreateSheet } from "@/components/settings/admin-user-create-sheet";
import { AdminUserEditSheet } from "@/components/settings/admin-user-edit-sheet";
import {
  useAppSlideCoordinator,
  useExclusiveAppSlide,
  useRegisterAppSlideClose,
} from "@/components/app/app-slide-coordinator";
import { appRoleLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import {
  dataTableHeadRowClass,
  dataTableShellClass,
  dataTableTdClass,
} from "@/lib/table-ui";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { ProfileSummary } from "@/types/profile";

export function AdminUsersTable({
  profiles,
}: {
  profiles: ProfileSummary[];
}) {
  const [editUser, setEditUser] = useState<ProfileSummary | null>(null);
  const { openExclusive } = useAppSlideCoordinator();
  const createSlide = useExclusiveAppSlide("admin-user-create");

  const closeEdit = useCallback(() => setEditUser(null), []);
  useRegisterAppSlideClose("admin-user-edit", closeEdit);

  const openEdit = useCallback(
    (user: ProfileSummary) => {
      openExclusive("admin-user-edit", () => setEditUser(user));
    },
    [openExclusive],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className={uiPageTitle}>Utenti</h1>
          <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
            Crea account collegati a Supabase Auth, modifica profilo e imposta
            le password di accesso. Solo gli admin gestiscono questo elenco.
          </p>
        </div>
        <button
          type="button"
          className={cn(uiBtnPrimary, "shrink-0 self-start")}
          onClick={createSlide.openSlide}
        >
          Nuovo utente
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
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="w-[8rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5"
                >
                  Ruolo
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
              {profiles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-fg-tertiary md:px-5"
                  >
                    Nessun utente. Crea il primo con «Nuovo utente».
                  </td>
                </tr>
              ) : (
                profiles.map((u) => (
                  <tr key={u.userId}>
                    <td className={cn(dataTableTdClass, "font-medium")}>
                      {u.fullName?.trim() || "—"}
                    </td>
                    <td
                      className={cn(
                        dataTableTdClass,
                        "break-all text-fg-secondary",
                      )}
                    >
                      {u.email || "—"}
                    </td>
                    <td className={dataTableTdClass}>
                      <span className="text-sm text-fg-primary">
                        {appRoleLabel[u.role]}
                      </span>
                    </td>
                    <td className={dataTableTdClass}>
                      <span
                        className={cn(
                          "text-sm",
                          u.isActive ? "text-success" : "text-fg-tertiary",
                        )}
                      >
                        {u.isActive ? "Attivo" : "Disattivato"}
                      </span>
                    </td>
                    <td className={dataTableTdClass}>
                      <button
                        type="button"
                        className={cn(uiBtnSecondary, "px-2.5 py-1 text-xs")}
                        onClick={() => openEdit(u)}
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

      <AdminUserCreateSheet
        open={createSlide.open}
        onClose={createSlide.closeSlide}
      />
      <AdminUserEditSheet
        open={editUser !== null}
        user={editUser}
        onClose={() => setEditUser(null)}
      />
    </div>
  );
}
