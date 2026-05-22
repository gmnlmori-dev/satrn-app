"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteInboxItem } from "@/lib/actions/delete-inbox-item";
import { canDeleteInboxItem } from "@/lib/inbox-delete";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { uiBtnGhost, uiBtnSecondary } from "@/lib/ui-classes";
import type { InboxItem } from "@/types/inbox";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export function InboxDeleteControls({
  item,
  currentUserId,
  embedded = false,
}: {
  item: InboxItem;
  currentUserId: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canDeleteInboxItem(item, currentUserId)) {
    return null;
  }

  const subject = item.subject?.trim() || "Senza oggetto";

  async function onConfirmDelete() {
    setError(null);
    setPending(true);
    try {
      const result = await deleteInboxItem(item.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/app/inbox");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const shellClass = embedded
    ? "border-t border-danger/20 bg-danger-muted/20 px-4 py-4 md:px-5 md:py-4"
    : cn(
        "rounded-[12px] border border-danger/25 bg-danger-muted/15 p-4 md:p-5",
      );

  if (confirmOpen) {
    return (
      <div className={shellClass} role="alertdialog" aria-labelledby="inbox-delete-title">
        <p id="inbox-delete-title" className="text-sm font-semibold text-danger">
          Confermi l&apos;eliminazione?
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">
          Stai per eliminare{" "}
          <span className="font-medium text-fg-primary">&ldquo;{subject}&rdquo;</span>.
          L&apos;ingresso verrà rimosso dal team in modo permanente.
        </p>
        {error ? (
          <p className="mt-3 rounded-[10px] border border-danger/30 bg-danger-muted px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            className="w-full sm:w-auto"
            onClick={() => {
              setConfirmOpen(false);
              setError(null);
            }}
          >
            Annulla
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            className="w-full sm:w-auto"
            onClick={() => void onConfirmDelete()}
          >
            {pending ? "Eliminazione…" : "Sì, elimina ingresso"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-danger/25 bg-danger-muted/50 text-danger"
            aria-hidden
          >
            <TrashIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg-primary">Elimina ingresso</p>
            <p className="mt-0.5 text-sm leading-relaxed text-fg-secondary">
              Rimuovi questo ingresso se non ti serve più convertirlo in richiesta.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
          className={cn(
            embedded ? uiBtnGhost : uiBtnSecondary,
            "w-full shrink-0 text-danger hover:bg-danger-muted/40 sm:w-auto",
          )}
        >
          Elimina
        </button>
      </div>
    </div>
  );
}
