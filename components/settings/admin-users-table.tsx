"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminUpdateProfile } from "@/lib/actions/update-profile-admin";
import { appRoleLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiControl, uiTransition } from "@/lib/ui-classes";
import {
  dataTableHeadRowClass,
  dataTableShellClass,
  dataTableTdClass,
} from "@/lib/table-ui";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { AppRole, ProfileSummary } from "@/types/profile";

const ROLES: AppRole[] = ["admin", "manager", "operator"];

const controlClass = cn(uiControl, "max-w-[14rem]");

export function AdminUsersTable({
  profiles,
}: {
  profiles: ProfileSummary[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function apply(userId: string, patch: { role?: AppRole; is_active?: boolean }) {
    setError(null);
    setInfo(null);
    setPendingId(userId);
    const r = await adminUpdateProfile({ userId, ...patch });
    setPendingId(null);
    if (!r.ok) setError(r.message);
    else {
      setInfo("Modifiche salvate.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Utenti</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Ruoli minimi interni — solo gli admin modificano questo elenco dal client.
          Per il primo deploy promuovi un admin dalla console SQL Supabase se serve.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-success" role="status">
          {info}
        </p>
      ) : null}

      <div className={dataTableShellClass}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className={dataTableHeadRowClass}>
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Nome
                </th>
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Email
                </th>
                <th scope="col" className="w-[13rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Ruolo
                </th>
                <th scope="col" className="w-[10rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Attivo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-default">
              {profiles.map((u) => {
                const busy = pendingId === u.userId;
                return (
                  <tr key={u.userId} className={busy ? "opacity-75" : ""}>
                    <td className={cn(dataTableTdClass, "font-medium")}>
                      {u.fullName?.trim() || "—"}
                    </td>
                    <td className={cn(dataTableTdClass, "break-all text-fg-secondary")}>
                      {u.email || "—"}
                    </td>
                    <td className={dataTableTdClass}>
                      <label className="sr-only" htmlFor={`role-${u.userId}`}>
                        Ruolo per {u.email}
                      </label>
                      <select
                        id={`role-${u.userId}`}
                        className={controlClass}
                        disabled={busy}
                        value={u.role}
                        onChange={(e) =>
                          void apply(u.userId, { role: e.target.value as AppRole })
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {appRoleLabel[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={dataTableTdClass}>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-fg-primary">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-line-default accent-accent"
                          checked={u.isActive}
                          disabled={busy}
                          onChange={(e) =>
                            void apply(u.userId, { is_active: e.target.checked })
                          }
                        />
                        {u.isActive ? "Account attivo" : "Disattivato"}
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
