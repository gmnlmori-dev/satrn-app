"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/app/user-avatar";
import { SettingsGroup } from "@/components/settings/settings-group";
import { updateMyAvatar } from "@/lib/actions/update-my-avatar";
import {
  AVATAR_GROUP_LABELS,
  type AvatarGroup,
  type AvatarKey,
  avatarLabel,
  avatarOptionsByGroup,
  avatarSrc,
  normalizeAvatarKey,
} from "@/lib/avatars";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";

const GROUPS: AvatarGroup[] = ["pianeti", "lune"];

type Props = {
  initialAvatarKey: string | null;
  /** Nome utente per l'anteprima e l'iniziale di fallback. */
  displayName: string;
  className?: string;
};

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 10.5 3.2 3.2L15 7" />
    </svg>
  );
}

export function AvatarPreferencePanel({
  initialAvatarKey,
  displayName,
  className,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<AvatarKey | null>(() =>
    normalizeAvatarKey(initialAvatarKey),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2200);
    return () => window.clearTimeout(t);
  }, [saved]);

  const onSelect = useCallback(
    async (next: AvatarKey | null) => {
      if (next === selected || saving) return;
      const previous = selected;
      setSaving(true);
      setError(null);
      setSaved(false);
      setSelected(next);

      const res = await updateMyAvatar(next);
      setSaving(false);

      if (!res.ok) {
        setSelected(previous);
        setError(res.message);
        return;
      }
      setSaved(true);
      // Aggiorna sidebar e contesto (memberAvatars) con il nuovo profilo.
      router.refresh();
    },
    [selected, saving, router],
  );

  const optionButtonClass = cn(
    uiTransition,
    uiFocusRingOffset,
    "group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center",
    "hover:border-line-strong hover:bg-elevated/60",
    "disabled:cursor-not-allowed disabled:opacity-60",
  );

  return (
    <SettingsGroup
      className={className}
      title="Immagine profilo"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : saved ? (
          <span className="text-success" role="status">
            Immagine profilo aggiornata.
          </span>
        ) : (
          <>
            Scegli un pianeta o una luna del sistema solare: sarà mostrata
            accanto al tuo nome nella sidebar, tra gli assegnatari e nelle note
            di team.
          </>
        )
      }
    >
      <div className="flex items-center gap-4 px-4 py-4">
        <UserAvatar
          avatarKey={selected}
          name={displayName}
          size="xl"
          title=""
          className="ring-1 ring-line-default"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-snug text-fg-primary">
            {displayName}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-fg-secondary">
            {selected
              ? `Immagine attuale: ${avatarLabel(selected)}.`
              : "Nessuna immagine: viene mostrata l'iniziale del nome."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSelect(null)}
          disabled={saving || selected === null}
          className={cn(
            uiTransition,
            uiFocusRingOffset,
            "shrink-0 rounded-md border border-line-default px-2.5 py-1.5 text-xs font-medium text-fg-secondary",
            "hover:bg-elevated hover:text-fg-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Rimuovi
        </button>
      </div>

      {GROUPS.map((group) => {
        const options = avatarOptionsByGroup(group);
        return (
          <div
            key={group}
            className={cn("px-4 py-4", saving && "opacity-70")}
            role="radiogroup"
            aria-label={`Immagine profilo: ${AVATAR_GROUP_LABELS[group]}`}
          >
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg-tertiary">
              {AVATAR_GROUP_LABELS[group]}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9">
              {options.map((opt) => {
                const active = opt.key === selected;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={opt.label}
                    title={`${opt.label} — ${opt.hint}`}
                    disabled={saving}
                    onClick={() => void onSelect(opt.key)}
                    className={cn(
                      optionButtonClass,
                      active
                        ? "border-accent bg-accent/10 ring-1 ring-accent"
                        : "border-line-default bg-surface",
                    )}
                  >
                    <span className="relative inline-flex h-11 w-11 overflow-hidden rounded-full sm:h-12 sm:w-12">
                      <Image
                        src={avatarSrc(opt.key)}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        draggable={false}
                        className={cn(
                          uiTransition,
                          "h-full w-full select-none group-hover:scale-105",
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "w-full truncate text-[11px] leading-tight",
                        active
                          ? "font-semibold text-accent"
                          : "text-fg-secondary",
                      )}
                    >
                      {opt.label}
                    </span>
                    {active ? (
                      <span
                        className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-fg"
                        aria-hidden
                      >
                        <CheckGlyph className="h-3 w-3" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </SettingsGroup>
  );
}
