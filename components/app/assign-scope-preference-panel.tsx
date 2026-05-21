"use client";

import { useCallback, useState } from "react";
import { updateMyPreferences } from "@/lib/actions/update-my-preferences";
import type { DefaultAssignScopePreference } from "@/lib/user-preferences";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";
import { Panel } from "@/components/ui/panel";
import { uiSectionTitle } from "@/lib/typography";

const options: {
  value: DefaultAssignScopePreference;
  label: string;
  description: string;
}[] = [
  {
    value: "all",
    label: "Tutte",
    description: "All’apertura mostra l’intera coda team.",
  },
  {
    value: "mine",
    label: "Le mie",
    description: "All’apertura mostra solo le richieste assegnate a te.",
  },
];

type Props = {
  initialScope: DefaultAssignScopePreference;
  className?: string;
};

export function AssignScopePreferencePanel({
  initialScope,
  className,
}: Props) {
  const [scope, setScope] = useState(initialScope);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const select = useCallback(async (next: DefaultAssignScopePreference) => {
    if (next === scope || saving) return;
    const previous = scope;
    setSaving(true);
    setError(null);
    setSaved(false);
    setScope(next);
    const res = await updateMyPreferences({ defaultAssignScope: next });
    setSaving(false);
    if (!res.ok) {
      setScope(previous);
      setError(res.message);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }, [scope, saving]);

  return (
    <Panel className={className}>
      <h2 className={uiSectionTitle}>Coda richieste</h2>
      <p className="mt-1.5 text-sm text-fg-secondary">
        Scegli la vista predefinita su{" "}
        <span className="font-medium text-fg-primary">Da seguire</span> e{" "}
        <span className="font-medium text-fg-primary">Richieste</span> (filtro
        «Le mie» / «Tutte»). La preferenza è salvata sul tuo profilo.
      </p>
      <div
        role="radiogroup"
        aria-label="Ambito predefinito richieste"
        className="mt-5 grid gap-2 sm:grid-cols-2"
      >
        {options.map((opt) => {
          const active = scope === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={saving}
              onClick={() => void select(opt.value)}
              className={cn(
                uiTransition,
                "rounded-[10px] border px-4 py-3 text-left",
                active
                  ? "border-accent bg-accent-muted"
                  : "border-line-default bg-surface hover:bg-elevated",
                saving && "cursor-wait opacity-80",
              )}
            >
              <span className="block text-sm font-medium text-fg-primary">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-fg-secondary">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-3 text-sm text-success" role="status">
          Preferenza salvata.
        </p>
      ) : null}
    </Panel>
  );
}
