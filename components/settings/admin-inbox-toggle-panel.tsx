"use client";

import { useCallback, useState } from "react";
import { adminUpdateAppSettings } from "@/lib/actions/admin-update-app-settings";
import { AppleToggle } from "@/components/ui/apple-toggle";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";

type Props = {
  initialEnabled: boolean;
};

export function AdminInboxTogglePanel({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onToggle = useCallback(
    async (nextEnabled: boolean) => {
      if (nextEnabled === enabled || saving) return;

      const previous = enabled;
      setSaving(true);
      setError(null);
      setEnabled(nextEnabled);

      const res = await adminUpdateAppSettings({ inboxEnabled: nextEnabled });
      setSaving(false);

      if (!res.ok) {
        setEnabled(previous);
        setError(res.message);
      }
    },
    [enabled, saving],
  );

  return (
    <SettingsGroup
      title="Funzionalità"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          "La modifica vale per tutti gli utenti. Con Inbox disattivata, menu, pagine e triage spariscono dall’app."
        )
      }
    >
      <SettingsRow
        label="Inbox"
        description={
          enabled
            ? "Visibile a tutti: menu, creazione, Da seguire e conversione in progetto."
            : "Nascosta per tutti finché non la riattivi."
        }
        disabled={saving}
        control={
          <AppleToggle
            checked={enabled}
            disabled={saving}
            onChange={(value) => void onToggle(value)}
            aria-label="Abilita Inbox per tutti gli utenti"
          />
        }
      />
    </SettingsGroup>
  );
}
