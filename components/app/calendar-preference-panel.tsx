"use client";

import { useCallback, useState } from "react";
import { updateMyPreferences } from "@/lib/actions/update-my-preferences";
import type { DefaultRequestsCalendarLayoutPreference } from "@/lib/user-preferences";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";

type Props = {
  initialCalendarLayout: DefaultRequestsCalendarLayoutPreference;
  className?: string;
};

export function CalendarPreferencePanel({
  initialCalendarLayout,
  className,
}: Props) {
  const [calendarLayout, setCalendarLayout] = useState(initialCalendarLayout);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCalendarLayoutChange = useCallback(
    async (next: DefaultRequestsCalendarLayoutPreference) => {
      if (next === calendarLayout || saving) return;

      const previous = calendarLayout;
      setSaving(true);
      setError(null);
      setCalendarLayout(next);

      const res = await updateMyPreferences({ defaultRequestsCalendarLayout: next });
      setSaving(false);

      if (!res.ok) {
        setCalendarLayout(previous);
        setError(res.message);
      }
    },
    [calendarLayout, saving],
  );

  return (
    <SettingsGroup
      className={className}
      title="Calendario"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          <>
            Layout predefinito per la pagina{" "}
            <span className="text-fg-secondary">Calendario</span> nel menu laterale.
          </>
        )
      }
    >
      <SettingsRow
        label="Vista predefinita"
        description={
          calendarLayout === "week"
            ? "Il calendario si apre sulla settimana corrente."
            : "Il calendario si apre sul mese corrente."
        }
        disabled={saving}
        control={
          <SegmentedControl
            ariaLabel="Layout calendario predefinito"
            value={calendarLayout}
            options={[
              { value: "month", label: "Mese" },
              { value: "week", label: "Settimana" },
            ]}
            onChange={(v) => void onCalendarLayoutChange(v)}
          />
        }
      />
    </SettingsGroup>
  );
}
