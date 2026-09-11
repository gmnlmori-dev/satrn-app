"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTeamTags } from "@/components/app/current-user-context";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { EntityTagPicker } from "@/components/tags/entity-tag-picker";
import { TagChips } from "@/components/tags/tag-chips";
import { setInboxTags } from "@/lib/actions/set-entity-tags";
import type { InboxItem } from "@/types/inbox";

/**
 * Tag di un ingresso inbox: modificabili finché non è convertito; in sola
 * lettura dopo la conversione (i tag sono già passati al progetto).
 */
export function InboxTagsPanel({ item }: { item: InboxItem }) {
  const router = useRouter();
  const { pulseTopBar } = useDetailSaveFeedback();
  const catalog = useTeamTags(item.teamId);
  const [tagIds, setTagIds] = useState<string[]>(item.tagIds);
  const readOnly = item.status === "converted" || Boolean(item.linkedRequestId);

  if (readOnly) {
    return (
      <TagChips
        tagIds={tagIds}
        catalog={catalog}
        size="md"
        emptyLabel="Nessun tag"
      />
    );
  }

  return (
    <EntityTagPicker
      id={`inbox-${item.id}-tags`}
      label=""
      catalog={catalog}
      selectedIds={tagIds}
      hint="Salvataggio immediato. I tag passano al progetto in caso di conversione."
      onChange={async (nextIds) => {
        const res = await setInboxTags(item.id, nextIds);
        if (!res.ok) throw new Error(res.message);
        setTagIds(nextIds);
        pulseTopBar();
        router.refresh();
      }}
    />
  );
}
