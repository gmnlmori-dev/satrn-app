"use client";

import { useCallback, useState } from "react";
import { updateMyPreferences } from "@/lib/actions/update-my-preferences";
import type {
  DefaultAssignScopePreference,
  DefaultRequestsCalendarLayoutPreference,
  DefaultRequestsViewPreference,
} from "@/lib/user-preferences";
import { AppleToggle } from "@/components/ui/apple-toggle";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-group";

type Props = {
  initialScope: DefaultAssignScopePreference;
  initialView: DefaultRequestsViewPreference;
  initialCalendarLayout: DefaultRequestsCalendarLayoutPreference;
  className?: string;
};

export function AssignScopePreferencePanel({
  initialScope,
  initialView,
  initialCalendarLayout,
  className,
}: Props) {
  const [scope, setScope] = useState(initialScope);
  const [view, setView] = useState(initialView);
  const [calendarLayout, setCalendarLayout] = useState(initialCalendarLayout);
  const [savingScope, setSavingScope] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [savingCalendarLayout, setSavingCalendarLayout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = scope === "mine";
  const saving = savingScope || savingView || savingCalendarLayout;

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

  const onViewChange = useCallback(
    async (next: DefaultRequestsViewPreference) => {
      if (next === view || savingView) return;

      const previous = view;
      setSavingView(true);
      setError(null);
      setView(next);

      const res = await updateMyPreferences({ defaultRequestsView: next });
      setSavingView(false);

      if (!res.ok) {
        setView(previous);
        setError(res.message);
      }
    },
    [view, savingView],
  );

  const onCalendarLayoutChange = useCallback(
    async (next: DefaultRequestsCalendarLayoutPreference) => {
      if (next === calendarLayout || savingCalendarLayout) return;

      const previous = calendarLayout;
      setSavingCalendarLayout(true);
      setError(null);
      setCalendarLayout(next);

      const res = await updateMyPreferences({ defaultRequestsCalendarLayout: next });
      setSavingCalendarLayout(false);

      if (!res.ok) {
        setCalendarLayout(previous);
        setError(res.message);
      }
    },
    [calendarLayout, savingCalendarLayout],
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
            Imposta filtro e vista predefiniti per{" "}
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
            onChange={(v) => void onToggleScope(v)}
            aria-label="Mostra solo le mie richieste"
          />
        }
      />
      <SettingsRow
        label="Vista predefinita"
        description={
          view === "calendar"
            ? "All’apertura di Richieste mostri il calendario scadenze."
            : "All’apertura di Richieste mostri l’elenco tabellare."
        }
        disabled={saving}
        control={
          <SegmentedControl
            ariaLabel="Vista predefinita richieste"
            value={view}
            options={[
              { value: "list", label: "Elenco" },
              { value: "calendar", label: "Calendario" },
            ]}
            onChange={(v) => void onViewChange(v)}
          />
        }
      />
      {view === "calendar" ? (
        <SettingsRow
          label="Calendario predefinito"
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
      ) : null}
    </SettingsGroup>
  );
}
