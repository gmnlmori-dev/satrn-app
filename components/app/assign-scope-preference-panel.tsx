"use client";

import { useCallback, useState } from "react";
import { updateMyPreferences } from "@/lib/actions/update-my-preferences";
import type { DefaultAssignScopePreference } from "@/lib/user-preferences";
import { AppleToggle } from "@/components/ui/apple-toggle";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";

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

  const isMine = scope === "mine";

  const onToggle = useCallback(
    async (nextMine: boolean) => {
      const next: DefaultAssignScopePreference = nextMine ? "mine" : "all";
      if (next === scope || saving) return;

      const previous = scope;
      setSaving(true);
      setError(null);
      setScope(next);

      const res = await updateMyPreferences({ defaultAssignScope: next });
      setSaving(false);

      if (!res.ok) {
        setScope(previous);
        setError(res.message);
      }
    },
    [scope, saving],
  );

  return (
    <SettingsGroup
      className={className}
      title="Richieste"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          <>
            Imposta il filtro predefinito su{" "}
            <span className="text-fg-secondary">Da seguire</span> e{" "}
            <span className="text-fg-secondary">Richieste</span>.
          </>
        )
      }
    >
      <SettingsRow
        label="Solo le mie"
        description={
          isMine
            ? "All’apertura vedi solo le richieste assegnate a te."
            : "All’apertura vedi tutta la coda del team."
        }
        disabled={saving}
        control={
          <AppleToggle
            checked={isMine}
            disabled={saving}
            onChange={(v) => void onToggle(v)}
            aria-label="Mostra solo le mie richieste"
          />
        }
      />
    </SettingsGroup>
  );
}
