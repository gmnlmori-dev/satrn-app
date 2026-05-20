"use client";

import { useState } from "react";
import { adminSetUserPassword } from "@/lib/actions/admin-set-user-password";
import { adminUpdateProfile } from "@/lib/actions/update-profile-admin";
import {
  AdminFormSection,
  AdminUserRoleFields,
  RequiredMark,
  adminUserInputClass,
  useAdminFormIds,
} from "@/components/settings/admin-user-form-fields";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { AppRole, ProfileSummary } from "@/types/profile";

export function AdminUserEditForm({
  user,
  onSuccess,
  onCancel,
}: {
  user: ProfileSummary;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const p = useAdminFormIds();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<AppRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const wantsPassword = password.length > 0 || passwordConfirm.length > 0;
    if (wantsPassword) {
      if (password !== passwordConfirm) {
        setError("Le password non coincidono.");
        return;
      }
    }

    setPending(true);
    try {
      const profileResult = await adminUpdateProfile({
        userId: user.userId,
        full_name: fullName,
        email,
        role,
        is_active: isActive,
      });
      if (!profileResult.ok) {
        setError(profileResult.message);
        return;
      }

      if (wantsPassword) {
        const pwResult = await adminSetUserPassword({
          userId: user.userId,
          password,
        });
        if (!pwResult.ok) {
          setError(pwResult.message);
          return;
        }
      }

      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pr-4 sm:pr-5">
        <div className="min-h-0 flex-1 divide-y divide-line-default overflow-y-auto pb-4 pr-3.5 sm:pr-5">
          <AdminFormSection title="Profilo">
            <div className="space-y-3">
              <div>
                <label htmlFor={p("fullName")} className={uiFormLabel}>
                  Nome visualizzato
                </label>
                <input
                  id={p("fullName")}
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={pending}
                  className={adminUserInputClass}
                />
              </div>
              <div>
                <label htmlFor={p("email")} className={uiFormLabel}>
                  Email <RequiredMark />
                </label>
                <input
                  id={p("email")}
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={pending}
                  className={adminUserInputClass}
                />
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection title="Permessi">
            <AdminUserRoleFields
              idPrefix={p("fields")}
              role={role}
              isActive={isActive}
              onRoleChange={setRole}
              onActiveChange={setIsActive}
              disabled={pending}
            />
          </AdminFormSection>

          <AdminFormSection title="Password">
            <p className="mb-3 text-sm leading-relaxed text-fg-secondary">
              Lascia vuoto per non modificare la password di accesso.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={p("password")} className={uiFormLabel}>
                  Nuova password
                </label>
                <input
                  id={p("password")}
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                  className={adminUserInputClass}
                />
              </div>
              <div>
                <label htmlFor={p("passwordConfirm")} className={uiFormLabel}>
                  Conferma password
                </label>
                <input
                  id={p("passwordConfirm")}
                  name="passwordConfirm"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={pending}
                  className={adminUserInputClass}
                />
              </div>
            </div>
          </AdminFormSection>
        </div>

        <div className="shrink-0 border-t border-line-default bg-surface pr-3.5 sm:pr-5 pt-4">
          {error ? (
            <p
              role="alert"
              className="mb-3 text-sm leading-relaxed text-danger"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              className={cn(uiBtnSecondary, "w-full sm:w-auto")}
              onClick={onCancel}
              disabled={pending}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className={cn(uiBtnPrimary, pending && "cursor-wait opacity-90")}
            >
              {pending ? "Salvataggio…" : "Salva modifiche"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
