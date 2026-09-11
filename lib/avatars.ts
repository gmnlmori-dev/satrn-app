/**
 * Catalogo immagini profilo integrate: pianeti e lune del sistema solare in
 * stile flat (SVG in `public/avatars/`). La chiave è salvata su
 * `profiles.avatar_key`; `null` = nessuna immagine (iniziale del nome).
 */

export type AvatarGroup = "pianeti" | "lune";

export type AvatarOption = {
  key: AvatarKey;
  label: string;
  group: AvatarGroup;
  /** Breve nota mostrata come tooltip nel selettore. */
  hint: string;
};

export const AVATAR_KEYS = [
  "mercurio",
  "venere",
  "terra",
  "marte",
  "giove",
  "saturno",
  "urano",
  "nettuno",
  "plutone",
  "luna",
  "io",
  "europa",
  "ganimede",
  "titano",
  "encelado",
  "tritone",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const AVATAR_OPTIONS: readonly AvatarOption[] = [
  { key: "mercurio", label: "Mercurio", group: "pianeti", hint: "Il più vicino al Sole" },
  { key: "venere", label: "Venere", group: "pianeti", hint: "Nubi dorate e dense" },
  { key: "terra", label: "Terra", group: "pianeti", hint: "Casa" },
  { key: "marte", label: "Marte", group: "pianeti", hint: "Il pianeta rosso" },
  { key: "giove", label: "Giove", group: "pianeti", hint: "Il gigante a bande" },
  { key: "saturno", label: "Saturno", group: "pianeti", hint: "Il signore degli anelli" },
  { key: "urano", label: "Urano", group: "pianeti", hint: "Ghiaccio color ciano" },
  { key: "nettuno", label: "Nettuno", group: "pianeti", hint: "Blu profondo e ventoso" },
  { key: "plutone", label: "Plutone", group: "pianeti", hint: "Il pianeta nano con il cuore" },
  { key: "luna", label: "Luna", group: "lune", hint: "La nostra Luna" },
  { key: "io", label: "Io", group: "lune", hint: "Luna vulcanica di Giove" },
  { key: "europa", label: "Europa", group: "lune", hint: "Crosta di ghiaccio screziata" },
  { key: "ganimede", label: "Ganimede", group: "lune", hint: "La luna più grande" },
  { key: "titano", label: "Titano", group: "lune", hint: "Atmosfera arancio di Saturno" },
  { key: "encelado", label: "Encelado", group: "lune", hint: "Ghiaccio e geyser" },
  { key: "tritone", label: "Tritone", group: "lune", hint: "Luna gelida di Nettuno" },
];

export const AVATAR_GROUP_LABELS: Record<AvatarGroup, string> = {
  pianeti: "Pianeti",
  lune: "Lune",
};

const AVATAR_KEY_SET: ReadonlySet<string> = new Set(AVATAR_KEYS);

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && AVATAR_KEY_SET.has(value);
}

/** Chiave valida oppure `null` (valori sconosciuti/vecchi → nessuna immagine). */
export function normalizeAvatarKey(value: unknown): AvatarKey | null {
  return isAvatarKey(value) ? value : null;
}

export function avatarSrc(key: AvatarKey): string {
  return `/avatars/${key}.svg`;
}

export function avatarLabel(key: AvatarKey): string {
  return AVATAR_OPTIONS.find((o) => o.key === key)?.label ?? key;
}

export function avatarOptionsByGroup(group: AvatarGroup): AvatarOption[] {
  return AVATAR_OPTIONS.filter((o) => o.group === group);
}
