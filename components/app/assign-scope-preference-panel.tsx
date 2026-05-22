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
  const [savingScope, setSavingScope] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = scope === "mine";

  const onToggleScope = useCallback(
    async (nextMine: boolean) => {
      const next: DefaultAssignScopePreference = nextMine ? "mine" : "all";
      if (next === scope || savingScope) return;

      const previous = scope;
      setSavingScope(true);
      setError(null);
      setScope(next);

      const res = await updateMyPreferences({ defaultAssignScope: next });
      setSavingScope(false);

      if (!res.ok) {
        setScope(previous);
        setError(res.message);
      }
    },
    [scope, savingScope],
  );

  return (
    <SettingsGroup
      className={className}
      title="Richieste, inbox e Da seguire"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          <>
            Filtro predefinito «Le mie» / «Tutte» su{" "}
            <span className="text-fg-secondary">Richieste</span>,{" "}
            <span className="text-fg-secondary">Inbox</span> e{" "}
            <span className="text-fg-secondary">Da seguire</span>.
          </>
        )
      }
    >
      <SettingsRow
        label="Solo le mie"
        description={
          isMine
            ? "All’apertura vedi solo richieste e inbox assegnate a te."
            : "All’apertura vedi tutta la coda del team."
        }
        disabled={savingScope}
        control={
          <AppleToggle
            checked={isMine}
            disabled={savingScope}
            onChange={(v) => void onToggleScope(v)}
            aria-label="Mostra solo le mie richieste"
          />
        }
      />
    </SettingsGroup>
  );
}
