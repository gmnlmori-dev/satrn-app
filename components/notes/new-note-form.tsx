"use client";

import { useId, useState } from "react";
import { createTeamNote } from "@/lib/actions/create-team-note";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { cn } from "@/lib/cn";
import { titleFromBody } from "@/lib/team-note-access";
import { uiBtnPrimary, uiBtnSecondary, uiControl, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { NoteVisibility } from "@/types/note";

const inputClass = cn(uiControl, "py-2.5 text-[15px]");

export type NewNoteFormProps = {
  onSuccess: (noteId: string) => void;
  onCancel: () => void;
  className?: string;
};

export function NewNoteForm({ onSuccess, onCancel, className }: NewNoteFormProps) {
  const uid = useId();
  const p = (name: string) => `${uid}-${name}`;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { pulseTopBar } = useDetailSaveFeedback();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) {
      setError("Scrivi un titolo o il testo della nota.");
      return;
    }

    const fd = new FormData();
    fd.set("title", trimmedTitle || titleFromBody(trimmedBody));
    fd.set("body", trimmedBody);
    fd.set("visibility", "private" satisfies NoteVisibility);

    setPending(true);
    try {
      const result = await createTeamNote(fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      pulseTopBar();
      setTitle("");
      setBody("");
      onSuccess(result.id);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pr-4 sm:pr-5">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 pr-3.5 sm:pr-5">
          <div>
            <label htmlFor={p("title")} className={uiFormLabel}>
              Titolo
            </label>
            <input
              id={p("title")}
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              autoComplete="off"
              className={inputClass}
              placeholder="Titolo breve (opzionale)"
            />
          </div>
          <div>
            <label htmlFor={p("body")} className={uiFormLabel}>
              Nota
            </label>
            <textarea
              id={p("body")}
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={pending}
              rows={10}
              autoFocus
              className={cn(inputClass, "min-h-[180px] resize-y")}
              placeholder="Scrivi il contenuto della nota…"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-line-default bg-surface pr-3.5 sm:pr-5 pt-4">
          {error ? (
            <p role="alert" className="mb-3 text-sm leading-relaxed text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              className={cn(uiBtnSecondary, uiTransition, "w-full sm:w-auto")}
              onClick={onCancel}
              disabled={pending}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className={cn(uiBtnPrimary, pending && "cursor-wait opacity-90")}
            >
              {pending ? "Salvataggio…" : "Salva nota"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
