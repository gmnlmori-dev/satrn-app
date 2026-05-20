"use client";

import { useState } from "react";
import { adminCreateUser } from "@/lib/actions/admin-create-user";
import {
  AdminUserRoleFields,
  RequiredMark,
  adminUserInputClass,
  useAdminFormIds,
} from "@/components/settings/admin-user-form-fields";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { AppRole } from "@/types/profile";

export function AdminUserCreateForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const p = useAdminFormIds();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>("operator");
  const [isActive, setIsActive] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("passwordConfirm") ?? "");
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setPending(true);
    try {
      const result = await adminCreateUser({
        email: String(fd.get("email") ?? ""),
        password,
        full_name: String(fd.get("fullName") ?? ""),
        role,
        is_active: isActive,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-4 sm:px-5">
      <div className="min-h-0 flex-1 space-y-4 pb-4">
        <div>
          <label htmlFor={p("email")} className={uiFormLabel}>
            Email <RequiredMark />
          </label>
          <input
            id={p("email")}
            name="email"
            type="email"
            required
            autoComplete="off"
            disabled={pending}
            className={adminUserInputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={p("password")} className={uiFormLabel}>
              Password <RequiredMark />
            </label>
            <input
              id={p("password")}
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={pending}
              className={adminUserInputClass}
            />
          </div>
          <div>
            <label htmlFor={p("passwordConfirm")} className={uiFormLabel}>
              Conferma password <RequiredMark />
            </label>
            <input
              id={p("passwordConfirm")}
              name="passwordConfirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={pending}
              className={adminUserInputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor={p("fullName")} className={uiFormLabel}>
            Nome
          </label>
          <input
            id={p("fullName")}
            name="fullName"
            autoComplete="name"
            disabled={pending}
            className={adminUserInputClass}
            placeholder="Nome visualizzato"
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
            {pending ? "Creazione…" : "Crea utente"}
          </button>
        </div>
      </div>
    </form>
  );
}
