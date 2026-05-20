"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  filterRequestsMine,
  type FollowUpAssigneeScope,
} from "@/lib/request-assignee";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import type { InboxItem } from "@/types/inbox";
import type { Request } from "@/types/request";
import { FollowUpView } from "@/components/follow-up/follow-up-view";

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

  const queueTotal =
    filteredOverdue.length + filteredToday.length + filteredUpcoming.length;

  return (
    <div className="space-y-6 md:space-y-8">
      {showMine ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50 sm:px-5"
          role="group"
          aria-label="Ambito assegnazione"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Mostra richieste
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
              {mineOnly
                ? "Solo quelle assegnate a te (inbox triage invariata)."
                : "Tutta la coda team (inbox triage invariata)."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScopeButton
              active={scope === "all"}
              onClick={() => setScope("all")}
            >
              Tutte
            </ScopeButton>
            <ScopeButton
              active={scope === "mine"}
              onClick={() => setScope("mine")}
            >
              Le mie
            </ScopeButton>
          </div>
        </div>
      ) : null}

      {mineOnly ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {queueTotal}
          </span>{" "}
          richieste assegnate a te in coda (ritardi + oggi + 7 giorni).
        </p>
      ) : null}

      <FollowUpView
        overdue={filteredOverdue}
        today={filteredToday}
        upcoming={filteredUpcoming}
        inbox={inbox}
      />
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        uiTransition,
        uiFocusRingInset,
        "rounded-md border px-3 py-1.5 text-sm font-semibold",
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}
