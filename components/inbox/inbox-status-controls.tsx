"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateInboxItemStatus } from "@/lib/actions/update-inbox-status";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import type { InboxItem, InboxItemStatus } from "@/types/inbox";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { inboxStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiBtnSecondary, uiTransition } from "@/lib/ui-classes";

const MANUAL: InboxItemStatus[] = ["new", "reviewed", "archived"];

export function InboxStatusControls({ item }: { item: InboxItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pulseTopBar } = useDetailSaveFeedback();

  const [value, setValue] = useState<InboxItemStatus>(() =>
    MANUAL.includes(item.status) ? item.status : "new",
  );

  useEffect(() => {
    if (MANUAL.includes(item.status)) setValue(item.status);
  }, [item.status]);

  const isLocked = item.status === "converted" || Boolean(item.linkedRequestId);

  async function save() {
    if (isLocked) return;
    setError(null);
    setPending(true);
    try {
      const r = await updateInboxItemStatus(item.id, value);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      pulseTopBar();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (isLocked) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <InboxStatusBadge status={item.status} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`inbox-status-${item.id}`} className="sr-only">
          Stato inbox
        </label>
        <select
          id={`inbox-status-${item.id}`}
          value={value}
          disabled={pending}
          onChange={(e) => setValue(e.target.value as InboxItemStatus)}
          className={cn(
            uiTransition,
            "min-w-[10rem] rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900",
            "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
          )}
        >
          {MANUAL.map((s) => (
            <option key={s} value={s}>
              {inboxStatusLabel[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className={cn(uiBtnSecondary, "text-sm")}
        >
          {pending ? "Salvataggio…" : "Aggiorna stato"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
