import { cn } from "@/lib/cn";
import { resolveTagsByIds, tagColorChipClass } from "@/lib/tags";
import type { TeamTag } from "@/types/tag";

type Props = {
  tagIds: string[];
  catalog: TeamTag[];
  className?: string;
  size?: "sm" | "md";
  /** Numero massimo di chip visibili; i restanti sono riassunti in "+N". */
  max?: number;
  /** Se impostato, mostra questo testo quando non ci sono tag (es. "—" in tabella). */
  emptyLabel?: string;
};

export function TagChips({
  tagIds,
  catalog,
  className,
  size = "sm",
  max,
  emptyLabel,
}: Props) {
  const tags = resolveTagsByIds(tagIds, catalog);
  if (tags.length === 0) {
    if (!emptyLabel) return null;
    return (
      <span className={cn("text-fg-tertiary", size === "sm" ? "text-xs" : "text-sm", className)}>
        {emptyLabel}
      </span>
    );
  }

  const visible = max && tags.length > max ? tags.slice(0, max) : tags;
  const hidden = tags.length - visible.length;
  const hiddenNames = hidden > 0 ? tags.slice(visible.length).map((t) => t.name).join(", ") : "";

  return (
    <ul
      className={cn(
        "flex flex-wrap",
        size === "sm" ? "gap-1" : "gap-1.5",
        className,
      )}
      aria-label="Tag"
    >
      {visible.map((tag) => (
        <li key={tag.id} className="min-w-0">
          <span
            className={cn(
              "inline-flex max-w-[10rem] items-center gap-1 truncate rounded-full font-medium",
              size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
              tagColorChipClass(tag.color),
            )}
            title={tag.name}
          >
            <span className="truncate">{tag.name}</span>
          </span>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <span
            className={cn(
              "inline-flex items-center rounded-full border border-line-default bg-surface font-medium text-fg-tertiary",
              size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
            )}
            title={hiddenNames}
          >
            +{hidden}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
