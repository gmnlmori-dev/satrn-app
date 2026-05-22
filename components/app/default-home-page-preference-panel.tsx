"use client";

import { useCallback, useState } from "react";
import { updateMyPreferences } from "@/lib/actions/update-my-preferences";
import {
  DEFAULT_HOME_PAGE_LABELS,
  type DefaultHomePagePreference,
} from "@/lib/user-preferences";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";

const HOME_PAGE_OPTIONS: DefaultHomePagePreference[] = [
  "dashboard",
  "follow-up",
  "requests",
];

type Props = {
  initialHomePage: DefaultHomePagePreference;
  className?: string;
};

export function DefaultHomePagePreferencePanel({
  initialHomePage,
  className,
}: Props) {
  const [homePage, setHomePage] = useState(initialHomePage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onHomePageChange = useCallback(
    async (next: DefaultHomePagePreference) => {
      if (next === homePage || saving) return;

      const previous = homePage;
      setSaving(true);
      setError(null);
      setHomePage(next);

      const res = await updateMyPreferences({ defaultHomePage: next });
      setSaving(false);

      if (!res.ok) {
        setHomePage(previous);
        setError(res.message);
      }
    },
    [homePage, saving],
  );

  return (
    <SettingsGroup
      className={className}
      title="Avvio app"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          <>
            Dopo il login e aprendo l&apos;app da{" "}
            <span className="text-fg-secondary">/</span> verrai portato alla
            pagina scelta.
          </>
        )
      }
    >
      <SettingsRow
        label="Pagina predefinita"
        description={`Attualmente: ${DEFAULT_HOME_PAGE_LABELS[homePage]}.`}
        disabled={saving}
        control={
          <SegmentedControl
            ariaLabel="Pagina predefinita dopo login"
            value={homePage}
            className="max-w-full flex-wrap"
            options={HOME_PAGE_OPTIONS.map((value) => ({
              value,
              label: DEFAULT_HOME_PAGE_LABELS[value],
            }))}
            onChange={(v) => void onHomePageChange(v)}
          />
        }
      />
    </SettingsGroup>
  );
}
