"use client";

import { useState } from "react";
import { adminSetUserPassword } from "@/lib/actions/admin-set-user-password";
import { adminUpdateProfile } from "@/lib/actions/update-profile-admin";
import {
  AdminUserRoleFields,
  RequiredMark,
  adminUserInputClass,
  useAdminFormIds,
} from "@/components/settings/admin-user-form-fields";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import { uiFormLabel, uiSectionHeading } from "@/lib/typography";
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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-4 sm:px-5">
      <div className="min-h-0 flex-1 space-y-5 pb-4">
        <div>
          <label htmlFor={p("fullName")} className={uiFormLabel}>
            Nome
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
        <AdminUserRoleFields
          idPrefix={p("fields")}
          role={role}
          isActive={isActive}
          onRoleChange={setRole}
          onActiveChange={setIsActive}
          disabled={pending}
        />

        <section>
          <h3 className={cn(uiSectionHeading, "mb-3")}>Password</h3>
          <p className="mb-3 text-sm text-fg-secondary">
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
        </section>
      </div>

      <div className="shrink-0 border-t border-line-default py-4">
        {error ? (
          <p role="alert" className="mb-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
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
            className={cn(uiBtnPrimary, "w-full sm:w-auto", pending && "cursor-wait opacity-90")}
          >
            {pending ? "Salvataggio…" : "Salva modifiche"}
          </button>
        </div>
      </div>
    </form>
  );
}
