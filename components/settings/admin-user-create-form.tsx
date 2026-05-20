"use client";

import { useState } from "react";
import { adminCreateUser } from "@/lib/actions/admin-create-user";
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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pr-4 sm:pr-5">
        <div className="min-h-0 flex-1 divide-y divide-line-default overflow-y-auto pb-4 pr-3.5 sm:pr-5">
          <AdminFormSection title="Accesso">
            <div className="space-y-3">
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
                  placeholder="nome@azienda.it"
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
            </div>
          </AdminFormSection>

          <AdminFormSection title="Profilo">
            <div>
              <label htmlFor={p("fullName")} className={uiFormLabel}>
                Nome visualizzato
              </label>
              <input
                id={p("fullName")}
                name="fullName"
                autoComplete="name"
                disabled={pending}
                className={adminUserInputClass}
                placeholder="Es. Mario Rossi"
              />
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
              {pending ? "Creazione…" : "Crea utente"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
