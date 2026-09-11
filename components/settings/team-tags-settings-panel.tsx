"use client";

import { useCallback, useState } from "react";
import {
  createTeamTag,
  deleteTeamTag,
  updateTeamTag,
} from "@/lib/actions/manage-team-tags";
import { TAG_COLOR_OPTIONS } from "@/lib/tags";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiControl } from "@/lib/ui-classes";
import {
  SettingsGroup,
} from "@/components/settings/settings-group";
import type { TagColor, TeamTag } from "@/types/tag";

type Props = {
  initialTags: TeamTag[];
  teamId: string;
};

export function TeamTagsSettingsPanel({ initialTags, teamId }: Props) {
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>("blue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<TagColor>("blue");

  const onCreate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await createTeamTag({ name, color, teamId });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setName("");
    setColor("blue");
    // Refresh list locally with optimistic id if available
    if (res.id) {
      setTags((prev) => [
        ...prev,
        {
          id: res.id!,
          teamId,
          name: name.trim(),
          color,
          createdByUserId: null,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  }, [busy, name, color, teamId]);

  const startEdit = (tag: TeamTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError(null);
  };

  const onSaveEdit = useCallback(async () => {
    if (!editingId || busy) return;
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
      prev.map((t) =>
        t.id === editingId
          ? { ...t, name: editName.trim(), color: editColor }
          : t,
      ),
    );
    setEditingId(null);
  }, [editingId, busy, editName, editColor]);

  const onDelete = useCallback(
    async (id: string) => {
      if (busy) return;
      if (!confirm("Eliminare questo tag? Verrà rimosso da tutti gli elementi.")) {
        return;
      }
      setBusy(true);
      setError(null);
      const res = await deleteTeamTag(id);
      setBusy(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setTags((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) setEditingId(null);
    },
    [busy, editingId],
  );

  return (
    <SettingsGroup
      title="Tag del team"
      footer={
        error ? (
          <span className="text-danger" role="alert">
            {error}
          </span>
        ) : (
          "I tag sono condivisi con tutto il team. Solo manager e admin possono crearli o modificarli; tutti i membri possono applicarli su progetti, task, note e checklist."
        )
      }
    >
      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="new-tag-name" className="mb-1 block text-xs text-fg-secondary">
              Nuovo tag
            </label>
            <input
              id="new-tag-name"
              className={uiControl}
              value={name}
              maxLength={40}
              placeholder="Es. Urgente, Cliente VIP…"
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onCreate();
                }
              }}
            />
          </div>
          <ColorSwatches
            value={color}
            onChange={setColor}
            disabled={busy}
            idPrefix="new-tag"
          />
          <button
            type="button"
            className={uiBtnPrimary}
            disabled={busy || !name.trim()}
            onClick={() => void onCreate()}
          >
            Aggiungi
          </button>
        </div>

        {tags.length === 0 ? (
          <p className="text-sm text-fg-tertiary">Nessun tag ancora.</p>
        ) : (
          <ul className="divide-y divide-line-default rounded-lg border border-line-default">
            {tags.map((tag) => (
              <li key={tag.id} className="px-3 py-2.5">
                {editingId === tag.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      className={cn(uiControl, "min-w-0 flex-1")}
                      value={editName}
                      maxLength={40}
                      disabled={busy}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <ColorSwatches
                      value={editColor}
                      onChange={setEditColor}
                      disabled={busy}
                      idPrefix={`edit-${tag.id}`}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={uiBtnPrimary}
                        disabled={busy || !editName.trim()}
                        onClick={() => void onSaveEdit()}
                      >
                        Salva
                      </button>
                      <button
                        type="button"
                        className={uiBtnSecondary}
                        disabled={busy}
                        onClick={() => setEditingId(null)}
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        TAG_COLOR_OPTIONS.find((c) => c.value === tag.color)
                          ?.chipClass,
                      )}
                    >
                      {tag.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={uiBtnSecondary}
                        disabled={busy}
                        onClick={() => startEdit(tag)}
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className={cn(uiBtnSecondary, "text-danger")}
                        disabled={busy}
                        onClick={() => void onDelete(tag.id)}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsGroup>
  );
}

function ColorSwatches({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: TagColor;
  onChange: (c: TagColor) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Colore tag"
      className="flex flex-wrap gap-1.5"
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
              "h-6 w-6 rounded-full border-2 transition",
              opt.swatchClass,
              selected
                ? "border-fg-primary scale-110"
                : "border-transparent opacity-80 hover:opacity-100",
            )}
          />
        );
      })}
    </div>
  );
}
