"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  persistAssigneeScopeInUrl,
  scopeFromSearchParam,
} from "@/lib/assignee-scope-url";
import {
  filterInboxMine,
  type FollowUpAssigneeScope,
} from "@/lib/request-assignee";
import { InboxListTable } from "@/components/inbox/inbox-list-table";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { InboxItem } from "@/types/inbox";

type Props = {
  items: InboxItem[];
  currentUserId: string;
  defaultScope: FollowUpAssigneeScope;
};

export function InboxWorkspace({ items, currentUserId, defaultScope }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlScope = searchParams.get("scope");
  const [scope, setScope] = useState<FollowUpAssigneeScope>(() =>
    scopeFromSearchParam(urlScope, defaultScope),
  );

  useEffect(() => {
    setScope(scopeFromSearchParam(urlScope, defaultScope));
  }, [urlScope, defaultScope]);

  function handleScopeChange(next: FollowUpAssigneeScope) {
    setScope(next);
    persistAssigneeScopeInUrl(next, pathname, searchParams);
  }

  const showMine = Boolean(currentUserId);
  const mineOnly = scope === "mine" && showMine;

  const filtered = useMemo(
    () => (mineOnly ? filterInboxMine(items, currentUserId) : items),
    [mineOnly, items, currentUserId],
  );

  const myCount = useMemo(
    () => (currentUserId ? filterInboxMine(items, currentUserId).length : 0),
    [items, currentUserId],
  );

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Inbox</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Raccogli testi grezzi da email, chat o note; ogni ingresso è
          assegnato a chi lo crea. Dal dettaglio puoi convertirlo in progetto.
        </p>
      </header>

      {showMine ? (
        <Panel padding className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-primary">Mostra inbox</p>
            <p className="mt-0.5 text-xs text-fg-tertiary">
              {mineOnly
                ? "Solo ingressi assegnati a te."
                : "Tutti gli ingressi del team."}
            </p>
          </div>
          <SegmentedControl
            ariaLabel="Ambito assegnazione inbox"
            value={scope}
            options={[
              { value: "all", label: "Tutte" },
              { value: "mine", label: "Le mie" },
            ]}
            onChange={handleScopeChange}
          />
        </Panel>
      ) : null}

      {mineOnly && myCount > 0 ? (
        <p className="text-sm text-fg-secondary">
          <span className="font-semibold tabular-nums text-fg-primary">
            {filtered.length}
          </span>{" "}
          ingressi assegnati a te.
        </p>
      ) : null}

      {items.length === 0 ? (
        <AppEmptyHint
          title="Nessun ingresso registrato"
          description="Quando arrivano messaggi, email o appunti da sistemare prima di aprire un progetto, aggiungili con Crea → Nuovo inbox nella barra laterale."
          className="py-10"
        />
      ) : filtered.length === 0 ? (
        <AppEmptyHint
          title="Nessun ingresso assegnato a te"
          description="Passa a Tutte per vedere la coda del team, oppure crea un nuovo ingresso."
          className="py-10"
        />
      ) : (
        <InboxListTable items={filtered} showAssignee={!mineOnly} />
      )}
    </div>
  );
}
