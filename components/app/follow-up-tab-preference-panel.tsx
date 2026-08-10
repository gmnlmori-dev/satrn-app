"use client";

import { useCallback, useState } from "react";
import { updateMyPreferences } from "@/lib/actions/update-my-preferences";
import {
  DEFAULT_FOLLOW_UP_TAB_LABELS,
  type DefaultFollowUpTabPreference,
} from "@/lib/user-preferences";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";

const FOLLOW_UP_TAB_OPTIONS: DefaultFollowUpTabPreference[] = [
  "overdue",
  "today",
  "upcoming",
  "all",
];

type Props = {
  initialTab: DefaultFollowUpTabPreference;
  className?: string;
};

export function FollowUpTabPreferencePanel({
  initialTab,
  className,
}: Props) {
  const [tab, setTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTabChange = useCallback(
    async (next: DefaultFollowUpTabPreference) => {
      if (next === tab || saving) return;

      const previous = tab;
      setSaving(true);
      setError(null);
      setTab(next);

      const res = await updateMyPreferences({ defaultFollowUpTab: next });
      setSaving(false);

      if (!res.ok) {
        setTab(previous);
        setError(res.message);
      }
    },
    [tab, saving],
  );

  return (
    <SettingsGroup
      className={className}
      title="Da seguire"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          <>
            Tab aperta all&apos;ingresso in Da seguire (senza link diretto a una
            finestra). «Tutte» include scadenze oltre 7 giorni e elementi senza
            scadenza.
          </>
        )
      }
    >
      <SettingsRow
        label="Tab predefinita"
        description={`Attualmente: ${DEFAULT_FOLLOW_UP_TAB_LABELS[tab]}.`}
        disabled={saving}
        control={
          <SegmentedControl
            ariaLabel="Tab predefinita su Da seguire"
            value={tab}
            className="max-w-full flex-wrap"
            options={FOLLOW_UP_TAB_OPTIONS.map((value) => ({
              value,
              label: DEFAULT_FOLLOW_UP_TAB_LABELS[value],
            }))}
            onChange={(v) => void onTabChange(v)}
          />
        }
      />
    </SettingsGroup>
  );
}
