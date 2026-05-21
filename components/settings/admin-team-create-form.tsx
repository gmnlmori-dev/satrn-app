"use client";

import { useEffect, useState } from "react";
import { adminCreateTeam } from "@/lib/actions/admin-create-team";
import {
  AdminFormSection,
  RequiredMark,
  adminUserInputClass,
  useAdminFormIds,
} from "@/components/settings/admin-user-form-fields";
import { slugifyName } from "@/lib/team-slug";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";

export function AdminTeamCreateForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const p = useAdminFormIds();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugifyName(name));
  }, [name, slugTouched]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    setPending(true);
    try {
      const result = await adminCreateTeam({
        name,
        slug,
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
          <AdminFormSection title="Team">
            <div className="space-y-3">
              <div>
                <label htmlFor={p("name")} className={uiFormLabel}>
                  Nome <RequiredMark />
                </label>
                <input
                  id={p("name")}
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={pending}
                  className={adminUserInputClass}
                  placeholder="Es. Commerciale"
                />
              </div>
              <div>
                <label htmlFor={p("slug")} className={uiFormLabel}>
                  Slug <RequiredMark />
                </label>
                <input
                  id={p("slug")}
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  disabled={pending}
                  className={cn(adminUserInputClass, "font-mono text-sm")}
                  placeholder="commerciale"
                />
                <p className="mt-1.5 text-xs text-fg-tertiary">
                  Identificativo univoco (lettere minuscole, numeri, trattini).
                </p>
              </div>
              <div className="flex items-center pb-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-fg-primary">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-line-default accent-accent"
                    checked={isActive}
                    disabled={pending}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  Team attivo
                </label>
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
              {pending ? "Creazione…" : "Crea team"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
