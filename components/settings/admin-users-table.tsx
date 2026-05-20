"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminUpdateProfile } from "@/lib/actions/update-profile-admin";
import { appRoleLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { AppRole, ProfileSummary } from "@/types/profile";

const ROLES: AppRole[] = ["admin", "manager", "operator"];

const controlClass = cn(
  uiTransition,
  "w-full max-w-[14rem] min-w-0 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[15px] leading-snug text-slate-900",
  "focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-100/10",
);

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
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-emerald-800 dark:text-emerald-300" role="status">
          {info}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/65">
                <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 md:px-5">
                  Nome
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 md:px-5">
                  Email
                </th>
                <th scope="col" className="w-[13rem] px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 md:px-5">
                  Ruolo
                </th>
                <th scope="col" className="w-[10rem] px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 md:px-5">
                  Attivo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {profiles.map((u) => {
                const busy = pendingId === u.userId;
                return (
                  <tr key={u.userId} className={busy ? "opacity-75" : ""}>
                    <td className="px-4 py-3 align-middle text-[15px] font-medium text-slate-900 md:px-5 dark:text-slate-100">
                      {u.fullName?.trim() || "—"}
                    </td>
                    <td className="break-all px-4 py-3 align-middle text-slate-600 md:px-5 dark:text-slate-400">
                      {u.email || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle md:px-5">
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
                    <td className="px-4 py-3 align-middle md:px-5">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 dark:border-slate-600 dark:bg-slate-950"
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
