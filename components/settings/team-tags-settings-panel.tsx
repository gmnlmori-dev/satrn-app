"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  useOptionalCurrentProfile,
  useTeamTags,
  useTeamsForCreate,
} from "@/components/app/current-user-context";
import { SettingsGroup } from "@/components/settings/settings-group";
import {
  createTeamTag,
  deleteTeamTag,
  updateTeamTag,
} from "@/lib/actions/manage-team-tags";
import { cn } from "@/lib/cn";
import { TAG_COLOR_OPTIONS, tagColorChipClass } from "@/lib/tags";
import { uiFieldLabel } from "@/lib/typography";
import {
  uiBtnIcon,
  uiBtnPrimary,
  uiBtnSecondary,
  uiControl,
  uiFocusRingOffset,
  uiTransition,
} from "@/lib/ui-classes";
import type { TagColor, TeamTag } from "@/types/tag";

const NAME_MAX = 40;

type Props = {
  initialTags: TeamTag[];
  teamId: string;
};

function sortTags(tags: TeamTag[]): TeamTag[] {
  return [...tags].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name, "it", { sensitivity: "base" }),
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
      />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function TagPreviewChip({
  name,
  color,
  className,
}: {
  name: string;
  color: TagColor;
  className?: string;
}) {
  const label = name.trim() || "Anteprima tag";
  return (
    <span
      className={cn(
        "inline-flex max-w-[14rem] items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tagColorChipClass(color),
        !name.trim() && "opacity-60",
        className,
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function ColorSwatches({
  value,
  onChange,
  disabled,
  idPrefix,
  label = "Colore",
}: {
  value: TagColor;
  onChange: (c: TagColor) => void;
  disabled?: boolean;
  idPrefix: string;
  label?: string;
}) {
  const selectedLabel =
    TAG_COLOR_OPTIONS.find((c) => c.value === value)?.label ?? "";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span id={`${idPrefix}-color-label`} className={cn(uiFieldLabel, "mb-0")}>
          {label}
        </span>
        <span className="text-xs text-fg-tertiary">{selectedLabel}</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${idPrefix}-color-label`}
        className="flex flex-wrap gap-2"
      >
        {TAG_COLOR_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              id={`${idPrefix}-${opt.value}`}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={opt.label}
              disabled={disabled}
              title={opt.label}
              onClick={() => onChange(opt.value)}
              className={cn(
                uiTransition,
                uiFocusRingOffset,
                "flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface",
                opt.swatchClass,
                selected
                  ? "ring-fg-primary"
                  : "ring-transparent opacity-80 hover:opacity-100 hover:ring-line-default",
                disabled && "cursor-not-allowed",
              )}
            >
              {selected ? (
                <svg
                  className="h-3.5 w-3.5 text-white drop-shadow"
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
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TeamTagsSettingsPanel({ initialTags, teamId }: Props) {
  const uid = useId();
  const me = useOptionalCurrentProfile();
  const teamsForCreate = useTeamsForCreate();
  const isAdmin = me?.role === "admin";

  const [selectedTeamId, setSelectedTeamId] = useState(teamId);
  const catalogForTeam = useTeamTags(selectedTeamId);

  const [tags, setTags] = useState<TeamTag[]>(() => sortTags(initialTags));
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>("blue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<TagColor>("blue");

  // Il catalogo nel contesto si aggiorna dopo ogni server action (revalidate
  // del layout): riallinea la lista locale (anche al cambio team dell'admin).
  useEffect(() => {
    setTags(sortTags(catalogForTeam));
  }, [catalogForTeam]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const selectedTeamName = useMemo(
    () => teamsForCreate.find((t) => t.id === selectedTeamId)?.name ?? null,
    [teamsForCreate, selectedTeamId],
  );

  const duplicateName = useMemo(() => {
    const needle = name.trim().toLowerCase();
    if (!needle) return false;
    return tags.some((t) => t.name.trim().toLowerCase() === needle);
  }, [name, tags]);

  const onCreate = useCallback(async () => {
    if (busy || !name.trim() || duplicateName) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await createTeamTag({ name, color, teamId: selectedTeamId });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const createdName = name.trim();
    setName("");
    if (res.id) {
      setTags((prev) =>
        sortTags([
          ...prev,
          {
            id: res.id!,
            teamId: selectedTeamId,
            name: createdName,
            color,
            createdByUserId: me?.userId ?? null,
            sortOrder: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );
    }
    setNotice(`Tag «${createdName}» creato.`);
  }, [busy, name, color, selectedTeamId, duplicateName, me?.userId]);

  const startEdit = (tag: TeamTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError(null);
    setNotice(null);
  };

  const onSaveEdit = useCallback(async () => {
    if (!editingId || busy || !editName.trim()) return;
    setBusy(true);
    setError(null);
    const res = await updateTeamTag({
      id: editingId,
      name: editName,
      color: editColor,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setTags((prev) =>
      sortTags(
        prev.map((t) =>
          t.id === editingId
            ? { ...t, name: editName.trim(), color: editColor }
            : t,
        ),
      ),
    );
    setEditingId(null);
    setNotice("Tag aggiornato.");
  }, [editingId, busy, editName, editColor]);

  const onDelete = useCallback(
    async (tag: TeamTag) => {
      if (busy) return;
      if (
        !confirm(
          `Eliminare il tag «${tag.name}»? Verrà rimosso da progetti, task, note, checklist e inbox che lo usano.`,
        )
      ) {
        return;
      }
      setBusy(true);
      setError(null);
      const res = await deleteTeamTag(tag.id);
      setBusy(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      if (editingId === tag.id) setEditingId(null);
      setNotice(`Tag «${tag.name}» eliminato.`);
    },
    [busy, editingId],
  );

  const footer = error ? (
    <span className="text-danger" role="alert">
      {error}
    </span>
  ) : notice ? (
    <span className="text-success" role="status">
      {notice}
    </span>
  ) : (
    "I tag sono condivisi con tutto il team: solo manager e admin li creano o modificano, tutti i membri possono applicarli a progetti, task, note, checklist e inbox. Puoi assegnare più tag allo stesso elemento."
  );

  return (
    <SettingsGroup title="Tag del team" footer={footer}>
      {isAdmin && teamsForCreate.length > 1 ? (
        <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[15px] font-medium leading-snug text-fg-primary">
              Team
            </p>
            <p className="mt-0.5 text-sm leading-snug text-fg-secondary">
              Come admin puoi gestire i tag di ogni team.
            </p>
          </div>
          <select
            aria-label="Team di cui gestire i tag"
            className={cn(uiControl, "w-full sm:w-auto sm:min-w-[14rem]")}
            value={selectedTeamId}
            disabled={busy}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setEditingId(null);
              setError(null);
            }}
          >
            {teamsForCreate.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Creazione */}
      <div className="px-4 py-4">
        <p className="text-[15px] font-medium leading-snug text-fg-primary">
          Nuovo tag
        </p>
        <p className="mt-0.5 text-sm leading-snug text-fg-secondary">
          Scegli un nome breve e un colore: così apparirà su tabelle, code e
          filtri{selectedTeamName ? ` del team ${selectedTeamName}` : ""}.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor={`${uid}-new-name`} className={cn(uiFieldLabel, "mb-0")}>
                  Nome
                </label>
                <span className="text-xs tabular-nums text-fg-tertiary">
                  {name.length}/{NAME_MAX}
                </span>
              </div>
              <input
                id={`${uid}-new-name`}
                className={cn(uiControl, "py-2.5")}
                value={name}
                maxLength={NAME_MAX}
                placeholder="Es. Urgente, Cliente VIP, Preventivo…"
                disabled={busy}
                autoComplete="off"
                aria-invalid={duplicateName || undefined}
                aria-describedby={duplicateName ? `${uid}-dup` : undefined}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onCreate();
                  }
                }}
              />
              {duplicateName ? (
                <p id={`${uid}-dup`} className="mt-1.5 text-xs text-danger">
                  Esiste già un tag con questo nome nel team.
                </p>
              ) : null}
            </div>
            <ColorSwatches
              value={color}
              onChange={setColor}
              disabled={busy}
              idPrefix={`${uid}-new`}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-line-default bg-canvas/40 px-4 py-3 md:min-w-[13rem]">
            <span className={cn(uiFieldLabel, "mb-0")}>Anteprima</span>
            <div>
              <TagPreviewChip name={name} color={color} />
            </div>
            <button
              type="button"
              className={cn(uiBtnPrimary, "mt-auto w-full")}
              disabled={busy || !name.trim() || duplicateName}
              aria-busy={busy}
              onClick={() => void onCreate()}
            >
              {busy ? "Salvataggio…" : "Aggiungi tag"}
            </button>
          </div>
        </div>
      </div>

      {/* Elenco */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-medium leading-snug text-fg-primary">
            Tag esistenti
          </p>
          <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-medium tabular-nums text-fg-secondary">
            {tags.length}
          </span>
        </div>

        {tags.length === 0 ? (
          <p className="mt-3 rounded-[10px] border border-dashed border-line-default px-3 py-4 text-center text-sm text-fg-tertiary">
            Nessun tag ancora. Crea il primo dal modulo qui sopra.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line-default overflow-hidden rounded-[10px] border border-line-default">
            {tags.map((tag) => {
              const colorLabel =
                TAG_COLOR_OPTIONS.find((c) => c.value === tag.color)?.label ??
                "";
              const editing = editingId === tag.id;
              return (
                <li
                  key={tag.id}
                  className={cn("px-3 py-2.5", editing && "bg-canvas/50")}
                >
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <div>
                          <label
                            htmlFor={`${uid}-edit-${tag.id}`}
                            className={uiFieldLabel}
                          >
                            Nome
                          </label>
                          <input
                            id={`${uid}-edit-${tag.id}`}
                            className={uiControl}
                            value={editName}
                            maxLength={NAME_MAX}
                            disabled={busy}
                            autoFocus
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void onSaveEdit();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingId(null);
                              }
                            }}
                          />
                        </div>
                        <TagPreviewChip
                          name={editName}
                          color={editColor}
                          className="sm:mb-2"
                        />
                      </div>
                      <ColorSwatches
                        value={editColor}
                        onChange={setEditColor}
                        disabled={busy}
                        idPrefix={`${uid}-edit-${tag.id}`}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className={uiBtnSecondary}
                          disabled={busy}
                          onClick={() => setEditingId(null)}
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          className={uiBtnPrimary}
                          disabled={busy || !editName.trim()}
                          onClick={() => void onSaveEdit()}
                        >
                          Salva
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "h-3 w-3 shrink-0 rounded-full",
                          TAG_COLOR_OPTIONS.find((c) => c.value === tag.color)
                            ?.swatchClass,
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-fg-primary">
                            {tag.name}
                          </span>
                          <TagPreviewChip name={tag.name} color={tag.color} />
                        </div>
                        <p className="mt-0.5 text-xs text-fg-tertiary">
                          Colore {colorLabel.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className={uiBtnIcon}
                          title="Modifica tag"
                          aria-label={`Modifica tag ${tag.name}`}
                          disabled={busy}
                          onClick={() => startEdit(tag)}
                        >
                          <IconPencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={cn(uiBtnIcon, "hover:text-danger")}
                          title="Elimina tag"
                          aria-label={`Elimina tag ${tag.name}`}
                          disabled={busy}
                          onClick={() => void onDelete(tag)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SettingsGroup>
  );
}
