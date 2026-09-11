"use client";

import Image from "next/image";
import { useMemberAvatarKey } from "@/components/app/current-user-context";
import { avatarLabel, avatarSrc, normalizeAvatarKey } from "@/lib/avatars";
import { cn } from "@/lib/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-sm",
  lg: "h-9 w-9 text-sm",
  xl: "h-16 w-16 text-2xl",
};

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 36,
  xl: 64,
};

/** Iniziale del nome (o dell'email) per il fallback senza immagine. */
export function userInitial(name: string | null | undefined, fallback = "?"): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}

type UserAvatarProps = {
  /** Chiave del set integrato (lib/avatars.ts); null/sconosciuta → iniziale. */
  avatarKey: string | null | undefined;
  /** Nome (o email) usato per l'iniziale di fallback e per il tooltip. */
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  /** Titolo/tooltip; default: nome. Passare "" per nessun tooltip. */
  title?: string;
  /** Se true l'immagine è decorativa (il nome è già visibile accanto). */
  decorative?: boolean;
};

/** Immagine profilo rotonda: pianeta/luna scelto o iniziale colorata. */
export function UserAvatar({
  avatarKey,
  name,
  size = "md",
  className,
  title,
  decorative = false,
}: UserAvatarProps) {
  const key = normalizeAvatarKey(avatarKey);
  const displayName = (name ?? "").trim();
  const tooltip = title === undefined ? displayName || undefined : title || undefined;
  const px = SIZE_PX[size];

  if (key) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 overflow-hidden rounded-full",
          SIZE_CLASS[size],
          className,
        )}
        title={tooltip}
      >
        <Image
          src={avatarSrc(key)}
          alt={decorative ? "" : `${displayName || "Utente"} · ${avatarLabel(key)}`}
          width={px}
          height={px}
          unoptimized
          draggable={false}
          className="h-full w-full select-none"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent",
        SIZE_CLASS[size],
        className,
      )}
      title={tooltip}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : displayName || undefined}
    >
      {userInitial(displayName)}
    </span>
  );
}

type MemberAvatarProps = Omit<UserAvatarProps, "avatarKey"> & {
  userId: string | null | undefined;
};

/** Avatar di un membro risolto dal contesto (`memberAvatars` / profilo). */
export function MemberAvatar({ userId, ...rest }: MemberAvatarProps) {
  const avatarKey = useMemberAvatarKey(userId);
  return <UserAvatar avatarKey={avatarKey} {...rest} />;
}

type AssigneeLike = { userId: string; label: string };

type AssigneeAvatarGroupProps = {
  assignees: readonly AssigneeLike[];
  /** Avatar mostrati prima del contatore "+N". */
  max?: number;
  size?: AvatarSize;
  className?: string;
};

/** Stack sovrapposto di avatar assegnatari con "+N" e tooltip con i nomi. */
export function AssigneeAvatarGroup({
  assignees,
  max = 3,
  size = "sm",
  className,
}: AssigneeAvatarGroupProps) {
  if (assignees.length === 0) return null;
  const visible = assignees.slice(0, max);
  const hidden = assignees.slice(max);
  const ringClass = "ring-2 ring-surface";
  const overlap = size === "xs" ? "-space-x-1.5" : "-space-x-2";

  return (
    <span
      className={cn("inline-flex shrink-0 items-center", overlap, className)}
      title={assignees.map((a) => a.label).join(", ")}
    >
      {visible.map((a) => (
        <MemberAvatar
          key={a.userId}
          userId={a.userId}
          name={a.label}
          size={size}
          title=""
          decorative
          className={ringClass}
        />
      ))}
      {hidden.length > 0 ? (
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-elevated font-medium text-fg-secondary",
            SIZE_CLASS[size],
            ringClass,
          )}
          aria-hidden
        >
          +{hidden.length}
        </span>
      ) : null}
    </span>
  );
}
