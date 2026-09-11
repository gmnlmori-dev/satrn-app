"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { cn } from "@/lib/cn";
import { canManageTeamTags } from "@/lib/permissions";
import { TAG_COLOR_OPTIONS, tagColorChipClass } from "@/lib/tags";
import { uiFieldLabel } from "@/lib/typography";
import { uiFocusRingOffset, uiLink, uiTransition } from "@/lib/ui-classes";
import type { TeamTag } from "@/types/tag";

type Props = {
  catalog: TeamTag[];
  selectedIds: string[];
  /**
   * Chiamato con la nuova selezione completa. Può essere sincrono (stato
   * locale di un form) o asincrono (salvataggio immediato via server action).
   */
  onChange: (nextIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  /** Etichetta del campo; stringa vuota per nasconderla. */
  label?: string;
  /** Testo di aiuto sotto i chip. */
  hint?: string;
  className?: string;
  /** Messaggio quando il team non ha tag. */
  emptyHint?: string;
  /**
   * `field`: riquadro stile controllo form con intestazione e contatore.
   * `compact`: solo chip piccoli in linea (checklist, card nota).
   */
  variant?: "field" | "compact";
  /** Id per collegare label e gruppo (accessibilità). */
  id?: string;
};

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 10.5 3 3 7-7" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function swatchClass(tag: TeamTag): string {
  return (
    TAG_COLOR_OPTIONS.find((c) => c.value === tag.color)?.swatchClass ??
    "bg-blue-500"
  );
}

export function EntityTagPicker({
  catalog,
  selectedIds,
  onChange,
  disabled = false,
  label = "Tag",
  hint,
  className,
  emptyHint,
  variant = "field",
  id,
}: Props) {
  const me = useOptionalCurrentProfile();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = catalog.filter((t) => selected.has(t.id)).length;
  const compact = variant === "compact";
  const busy = disabled || pending;
  const canManage = me ? canManageTeamTags(me.role) : false;

  function commit(next: string[]) {
    setError(null);
    startTransition(async () => {
      try {
        await onChange(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore salvataggio tag.");
      }
    });
  }

  function toggle(tagId: string) {
    if (busy) return;
    const next = selected.has(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    commit(next);
  }

  function clearAll() {
    if (busy || selectedIds.length === 0) return;
    commit([]);
  }

  const groupId = id ?? undefined;
  const labelId = groupId ? `${groupId}-label` : undefined;

  const header =
    label || !compact ? (
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {label ? (
          <span id={labelId} className={cn(uiFieldLabel, "mb-0")}>
            {label}
          </span>
        ) : (
          <span />
        )}
        {!compact ? (
          <span className="flex items-center gap-2 text-xs text-fg-tertiary">
            <span className="tabular-nums">
              {selectedCount === 0
                ? "Nessuno selezionato"
                : selectedCount === 1
                  ? "1 selezionato"
                  : `${selectedCount} selezionati`}
            </span>
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                disabled={busy}
                className={cn(uiLink, "text-xs disabled:opacity-50")}
              >
                Rimuovi tutti
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
    ) : null;

  if (catalog.length === 0) {
    return (
      <div className={className}>
        {label && !compact ? (
          <p className={uiFieldLabel}>{label}</p>
        ) : null}
        <p
          className={cn(
            "text-xs text-fg-tertiary",
            !compact &&
              "rounded-[10px] border border-dashed border-line-default px-3 py-2.5",
          )}
        >
          {emptyHint ??
            (canManage
              ? "Nessun tag disponibile per questo team."
              : "Nessun tag del team. Chiedi al manager di crearli in Impostazioni.")}
          {canManage ? (
            <>
              {" "}
              <Link href="/app/settings" className={uiLink}>
                Crea i tag in Impostazioni
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {header}
      <div
        role="group"
        aria-labelledby={labelId}
        aria-busy={pending || undefined}
        className={cn(
          "flex flex-wrap",
          compact
            ? "gap-1"
            : cn(
                uiTransition,
                "gap-1.5 rounded-[10px] border border-line-default bg-field px-2.5 py-2",
                busy && "opacity-70",
              ),
        )}
      >
        {catalog.map((tag) => {
          const active = selected.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              disabled={busy}
              aria-pressed={active}
              title={active ? `Rimuovi tag ${tag.name}` : `Aggiungi tag ${tag.name}`}
              onClick={() => toggle(tag.id)}
              className={cn(
                uiTransition,
                uiFocusRingOffset,
                "inline-flex max-w-full items-center gap-1 rounded-full border font-medium",
                compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
                active
                  ? cn(
                      tagColorChipClass(tag.color),
                      "border-transparent shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
                    )
                  : "border-line-default bg-surface text-fg-secondary hover:border-fg-tertiary/50 hover:text-fg-primary",
                busy && "cursor-not-allowed",
              )}
            >
              {active ? (
                <IconCheck className={compact ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
              ) : (
                <span
                  aria-hidden
                  className={cn(
                    "inline-block shrink-0 rounded-full",
                    compact ? "h-2 w-2" : "h-2.5 w-2.5",
                    swatchClass(tag),
                  )}
                />
              )}
              <span className="truncate">{tag.name}</span>
              {!active && !compact ? (
                <IconPlus className="h-3 w-3 shrink-0 text-fg-tertiary" />
              ) : null}
            </button>
          );
        })}
      </div>
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-fg-tertiary">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
