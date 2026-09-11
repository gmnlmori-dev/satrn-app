import type { TagColor, TeamTag, TeamTagRow } from "@/types/tag";

export const TAG_COLOR_OPTIONS: {
  value: TagColor;
  label: string;
  chipClass: string;
  swatchClass: string;
}[] = [
  {
    value: "slate",
    label: "Grigio",
    chipClass:
      "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100",
    swatchClass: "bg-slate-400",
  },
  {
    value: "red",
    label: "Rosso",
    chipClass: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-100",
    swatchClass: "bg-red-500",
  },
  {
    value: "orange",
    label: "Arancio",
    chipClass:
      "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100",
    swatchClass: "bg-orange-500",
  },
  {
    value: "amber",
    label: "Ambra",
    chipClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
    swatchClass: "bg-amber-400",
  },
  {
    value: "green",
    label: "Verde",
    chipClass:
      "bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-100",
    swatchClass: "bg-green-500",
  },
  {
    value: "teal",
    label: "Teal",
    chipClass:
      "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100",
    swatchClass: "bg-teal-500",
  },
  {
    value: "blue",
    label: "Blu",
    chipClass:
      "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100",
    swatchClass: "bg-blue-500",
  },
  {
    value: "indigo",
    label: "Indaco",
    chipClass:
      "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100",
    swatchClass: "bg-indigo-500",
  },
  {
    value: "purple",
    label: "Viola",
    chipClass:
      "bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100",
    swatchClass: "bg-purple-500",
  },
  {
    value: "pink",
    label: "Rosa",
    chipClass:
      "bg-pink-100 text-pink-900 dark:bg-pink-950/50 dark:text-pink-100",
    swatchClass: "bg-pink-500",
  },
];

export function parseTagColor(raw: string | null | undefined): TagColor {
  if (!raw) return "blue";
  return TAG_COLOR_OPTIONS.some((c) => c.value === raw)
    ? (raw as TagColor)
    : "blue";
}

export function tagColorChipClass(color: TagColor): string {
  return (
    TAG_COLOR_OPTIONS.find((c) => c.value === color)?.chipClass ??
    TAG_COLOR_OPTIONS.find((c) => c.value === "blue")!.chipClass
  );
}

export function teamTagRowToTeamTag(row: TeamTagRow): TeamTag {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    color: parseTagColor(row.color),
    createdByUserId: row.created_by_user_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolveTagsByIds(
  tagIds: string[],
  catalog: TeamTag[],
): TeamTag[] {
  if (tagIds.length === 0 || catalog.length === 0) return [];
  const map = new Map(catalog.map((t) => [t.id, t]));
  return tagIds
    .map((id) => map.get(id))
    .filter((t): t is TeamTag => Boolean(t));
}

export function entityHasTagId(tagIds: string[] | undefined, tagId: string): boolean {
  if (!tagId || tagId === "all") return true;
  return (tagIds ?? []).includes(tagId);
}

/** Dedup + rimozione valori vuoti, preservando l'ordine. */
export function uniqueTagIds(ids: readonly (string | null | undefined)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Legge un campo form `tagIds` serializzato come JSON array di stringhe.
 * Accetta anche valori ripetuti (`getAll`) per compatibilità.
 */
export function parseTagIdsFromFormData(fd: FormData, name = "tagIds"): string[] {
  const values = fd.getAll(name).map((v) => String(v));
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          out.push(...parsed.filter((x): x is string => typeof x === "string"));
        }
        continue;
      } catch {
        continue;
      }
    }
    out.push(trimmed);
  }
  return uniqueTagIds(out);
}

/** Legge una mappa `{ checklistTaskId: tagIds[] }` serializzata JSON. */
export function parseChecklistTagMapFromFormData(
  fd: FormData,
  name = "checklistTagIds",
): Record<string, string[]> {
  const raw = String(fd.get(name) ?? "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [taskId, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (!taskId || !Array.isArray(ids)) continue;
      const clean = uniqueTagIds(
        ids.filter((x): x is string => typeof x === "string"),
      );
      if (clean.length > 0) out[taskId] = clean;
    }
    return out;
  } catch {
    return {};
  }
}

/** Solo i tag appartenenti al team indicato (per cataloghi multi-team dell'admin). */
export function tagsForTeam(catalog: TeamTag[], teamId: string | null | undefined): TeamTag[] {
  if (!teamId) return catalog;
  return catalog.filter((t) => t.teamId === teamId);
}

/** Mantiene solo gli id presenti nel catalogo (es. dopo cambio team). */
export function keepKnownTagIds(tagIds: string[], catalog: TeamTag[]): string[] {
  if (tagIds.length === 0) return tagIds;
  const known = new Set(catalog.map((t) => t.id));
  return tagIds.filter((id) => known.has(id));
}
