"use client";

import { ConvertInboxForm } from "@/components/inbox/convert-inbox-form";
import { InboxDeleteControls } from "@/components/inbox/inbox-delete-controls";
import { canDeleteInboxItem } from "@/lib/inbox-delete";
import { cn } from "@/lib/cn";
import { uiCard } from "@/lib/surfaces";
import type { InboxItem } from "@/types/inbox";

export function InboxUnconvertedActions({
  item,
  currentUserId,
}: {
  item: InboxItem;
  currentUserId: string;
}) {
  const showDelete = canDeleteInboxItem(item, currentUserId);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-fg-primary">
          Gestisci ingresso
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-fg-secondary">
          Converti in progetto operativo oppure elimina l&apos;ingresso se non ti
          serve più.
        </p>
      </div>

      <div className={cn(uiCard, "overflow-hidden border-success/25")}>
        <div className="bg-success-muted/10 p-4 md:p-5">
          <ConvertInboxForm item={item} embedded />
        </div>
        {showDelete ? (
          <InboxDeleteControls
            item={item}
            currentUserId={currentUserId}
            embedded
          />
        ) : null}
      </div>
    </section>
  );
}
