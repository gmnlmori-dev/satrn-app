"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteInboxItem } from "@/lib/actions/delete-inbox-item";
import { canDeleteInboxItem } from "@/lib/inbox-delete";
import { Button } from "@/components/ui/button";
import type { InboxItem } from "@/types/inbox";

export function InboxDeleteControls({
  item,
  currentUserId,
}: {
  item: InboxItem;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canDeleteInboxItem(item, currentUserId)) {
    return null;
  }

  async function onDelete() {
    const label = item.subject?.trim() || "questo ingresso";
    const confirmed = window.confirm(
      `Eliminare "${label}"?\n\nL'operazione non può essere annullata.`,
    );
    if (!confirmed) return;

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

  return (
    <div className="mt-6 border-t border-line-default pt-6">
      <p className="text-sm font-medium text-fg-primary">Elimina ingresso</p>
      <p className="mt-1 max-w-xl text-sm text-fg-secondary">
        Rimuove definitivamente questo ingresso dal team. Disponibile solo per
        i tuoi ingressi non ancora convertiti in richiesta.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        variant="danger"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={() => void onDelete()}
      >
        {pending ? "Eliminazione…" : "Elimina ingresso"}
      </Button>
    </div>
  );
}
