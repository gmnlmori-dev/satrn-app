"use client";

import { useInboxEnabled } from "@/components/app/current-user-context";
import { cn } from "@/lib/cn";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { uiBtnSecondary } from "@/lib/ui-classes";

/** Nessuna riga in tabella (non dipende dai filtri). */
export function RequestsDatabaseEmptyState() {
  const inboxEnabled = useInboxEnabled();

  return (
    <AppEmptyState
      icon="queue"
      title="La scrivania è ancora vuota"
      description={
        inboxEnabled
          ? "Crea il primo progetto da Crea → Nuovo progetto nel menu laterale. Per testi grezzi da classificare, usa Crea → Nuovo inbox."
          : "Crea il primo progetto da Crea → Nuovo progetto nel menu laterale."
      }
    />
  );
}

export function RequestsEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <AppEmptyState
      icon="search"
      title="Nessun risultato con i filtri attuali"
      description="Prova a cambiare la ricerca oppure reimposta filtri e ordinamento per vedere di nuovo l’elenco completo."
    >
      <button type="button" onClick={onReset} className={cn(uiBtnSecondary, "px-4 py-2.5")}>
        Reimposta filtri
      </button>
    </AppEmptyState>
  );
}
