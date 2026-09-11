import { cn } from "@/lib/cn";
import { resolveTagsByIds, tagColorChipClass } from "@/lib/tags";
import type { TeamTag } from "@/types/tag";

type Props = {
  tagIds: string[];
  catalog: TeamTag[];
  className?: string;
  size?: "sm" | "md";
};

export function TagChips({
  tagIds,
  catalog,
  className,
  size = "sm",
}: Props) {
  const tags = resolveTagsByIds(tagIds, catalog);
  if (tags.length === 0) return null;

  return (
    <ul
      className={cn(
        "flex flex-wrap gap-1",
        size === "sm" ? "gap-1" : "gap-1.5",
        className,
      )}
    >
      {tags.map((tag) => (
        <li key={tag.id}>
          <span
            className={cn(
              "inline-flex max-w-[10rem] truncate rounded-full font-medium",
              size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
              tagColorChipClass(tag.color),
            )}
            title={tag.name}
          >
            {tag.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
