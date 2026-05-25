"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  filterInboxMine,
  filterRequestsMine,
  type FollowUpAssigneeScope,
} from "@/lib/request-assignee";
import { cn } from "@/lib/cn";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Panel } from "@/components/ui/panel";
import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";
import { FollowUpView } from "@/components/follow-up/follow-up-view";
import { uiOverline } from "@/lib/typography";

type Props = {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  inbox: InboxItem[];
  currentUserId: string;
  defaultScope: FollowUpAssigneeScope;
};

function scopeFromSearchParam(
  raw: string | null,
  fallback: FollowUpAssigneeScope,
): FollowUpAssigneeScope {
  if (raw === "mine") return "mine";
  if (raw === "all") return "all";
  return fallback;
}

export function FollowUpAssigneeScope({
  overdue,
  today,
  upcoming,
  inbox,
  currentUserId,
  defaultScope,
}: Props) {
  const searchParams = useSearchParams();
  const urlScope = searchParams.get("scope");
  const [scope, setScope] = useState<FollowUpAssigneeScope>(() =>
    scopeFromSearchParam(urlScope, defaultScope),
  );

  useEffect(() => {
    setScope(scopeFromSearchParam(urlScope, defaultScope));
  }, [urlScope, defaultScope]);

  const showMine = Boolean(currentUserId);
  const mineOnly = scope === "mine" && showMine;

  const filteredOverdue = useMemo(
    () => (mineOnly ? filterRequestsMine(overdue, currentUserId) : overdue),
    [mineOnly, overdue, currentUserId],
  );
  const filteredToday = useMemo(
    () => (mineOnly ? filterRequestsMine(today, currentUserId) : today),
    [mineOnly, today, currentUserId],
  );
  const filteredUpcoming = useMemo(
    () => (mineOnly ? filterRequestsMine(upcoming, currentUserId) : upcoming),
    [mineOnly, upcoming, currentUserId],
  );
  const filteredInbox = useMemo(
    () => (mineOnly ? filterInboxMine(inbox, currentUserId) : inbox),
    [mineOnly, inbox, currentUserId],
  );

  const queueTotal =
    filteredOverdue.length + filteredToday.length + filteredUpcoming.length;

  return (
    <div className="space-y-6 md:space-y-8">
      <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line-default pt-4">
        <div>
          <dt className={uiOverline}>In coda richieste</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg-primary">
            {queueTotal}
          </dd>
        </div>
        <div>
          <dt className={uiOverline}>In ritardo</dt>
          <dd
            className={cn(
              "mt-0.5 text-lg font-semibold tabular-nums",
              filteredOverdue.length > 0 ? "text-danger" : "text-fg-primary",
            )}
          >
            {filteredOverdue.length}
          </dd>
        </div>
        <div>
          <dt className={uiOverline}>Inbox triage</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg-primary">
            {filteredInbox.length}
          </dd>
        </div>
      </dl>

      {showMine ? (
        <Panel padding className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-primary">Mostra coda</p>
            <p className="mt-0.5 text-xs text-fg-tertiary">
              {mineOnly
                ? "Solo richieste e inbox assegnate a te."
                : "Tutta la coda del team."}
            </p>
          </div>
          <SegmentedControl
            ariaLabel="Ambito assegnazione"
            value={scope}
            options={[
              { value: "all", label: "Tutte" },
              { value: "mine", label: "Le mie" },
            ]}
            onChange={setScope}
          />
        </Panel>
      ) : null}

      <FollowUpView
        overdue={filteredOverdue}
        today={filteredToday}
        upcoming={filteredUpcoming}
        inbox={filteredInbox}
      />
    </div>
  );
}
