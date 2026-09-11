"use client";

import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { tagColorChipClass } from "@/lib/tags";
import { uiCaption } from "@/lib/typography";
import type { TeamTag } from "@/types/tag";

type Props = {
  catalog: TeamTag[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
  /** Se true, mostra messaggio quando non ci sono tag nel team. */
  emptyHint?: string;
};

export function EntityTagPicker({
  catalog,
  selectedIds,
  onChange,
  disabled = false,
  label = "Tag",
  className,
  emptyHint = "Nessun tag del team. Un manager può crearli in Impostazioni.",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (catalog.length === 0) {
    return (
      <div className={className}>
        {label ? (
          <p className={cn(uiCaption, "mb-1.5 text-fg-tertiary")}>{label}</p>
        ) : null}
        <p className="text-xs text-fg-tertiary">{emptyHint}</p>
      </div>
    );
  }

  function toggle(tagId: string) {
    if (disabled || pending) return;
    const next = selected.has(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    setError(null);
    startTransition(async () => {
      try {
        await onChange(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore salvataggio tag.");
      }
    });
  }

  return (
    <div className={className}>
      {label ? (
        <p className={cn(uiCaption, "mb-1.5 text-fg-tertiary")}>{label}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {catalog.map((tag) => {
          const active = selected.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              disabled={disabled || pending}
              aria-pressed={active}
              onClick={() => toggle(tag.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium transition-opacity",
                tagColorChipClass(tag.color),
                active
                  ? "ring-2 ring-fg-primary/40 ring-offset-1 ring-offset-canvas"
                  : "opacity-55 hover:opacity-90",
                (disabled || pending) && "cursor-not-allowed",
              )}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
