"use client";

import { useId, useState } from "react";
import { createRequest } from "@/lib/actions/create-request";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel, uiSectionHeading } from "@/lib/typography";

const inputClass = cn(
  uiTransition,
  "w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] leading-snug text-slate-900",
  "placeholder:text-slate-500 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-100/10"
);

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-5 first:pt-0">
      <h3 className={cn(uiSectionHeading, "mb-3")}>{title}</h3>
      {children}
    </section>
  );
}

export type NewRequestFormProps = {
  onSuccess: (requestId: string) => void;
  onCancel: () => void;
  /** Extra class on the root form (e.g. layout inside sheet) */
  className?: string;
};

/**
 * Form creazione richiesta — pensato per uso dentro {@link NewRequestSlideOver}.
 */
export function NewRequestForm({
  onSuccess,
  onCancel,
  className,
}: NewRequestFormProps) {
  const uid = useId();
  const p = (name: string) => `${uid}-${name}`;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pulseTopBar } = useDetailSaveFeedback();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    try {
      const result = await createRequest(fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      pulseTopBar();
      form.reset();
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
        <div className="min-h-0 flex-1 divide-y divide-slate-200/90 overflow-y-auto pb-4 pr-3.5 sm:pr-5 dark:divide-slate-800">
          <FormSection title="Richiesta">
            <div>
              <label htmlFor={p("title")} className={uiFormLabel}>
                Titolo
              </label>
              <input
                id={p("title")}
                name="title"
                required
                disabled={pending}
                autoComplete="off"
                className={inputClass}
                placeholder="Es. Rinnovo contratto assistenza"
              />
            </div>
          </FormSection>

          <FormSection title="Cliente e contatto">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={p("companyName")} className={uiFormLabel}>
                  Azienda
                </label>
                <input
                  id={p("companyName")}
                  name="companyName"
                  required
                  disabled={pending}
                  autoComplete="organization"
                  className={inputClass}
                  placeholder="Ragione sociale"
                />
              </div>
              <div>
                <label htmlFor={p("source")} className={uiFormLabel}>
                  Fonte
                </label>
                <input
                  id={p("source")}
                  name="source"
                  disabled={pending}
                  className={inputClass}
                  placeholder="Email, sito, referral…"
                />
              </div>
              <div>
                <label htmlFor={p("contactName")} className={uiFormLabel}>
                  Nome contatto
                </label>
                <input
                  id={p("contactName")}
                  name="contactName"
                  required
                  disabled={pending}
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={p("contactEmail")} className={uiFormLabel}>
                  Email contatto
                </label>
                <input
                  id={p("contactEmail")}
                  name="contactEmail"
                  type="email"
                  required
                  disabled={pending}
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Classificazione">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={p("status")} className={uiFormLabel}>
                  Stato iniziale
                </label>
                <select
                  id={p("status")}
                  name="status"
                  disabled={pending}
                  className={inputClass}
                  defaultValue="new"
                >
                  <option value="new">Nuova</option>
                  <option value="in_review">In valutazione</option>
                  <option value="waiting">In attesa</option>
                  <option value="follow_up">Da seguire</option>
                  <option value="closed">Chiusa</option>
                </select>
              </div>
              <div>
                <label htmlFor={p("priority")} className={uiFormLabel}>
                  Priorità
                </label>
                <select
                  id={p("priority")}
                  name="priority"
                  disabled={pending}
                  className={inputClass}
                  defaultValue="medium"
                >
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Bassa</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Dettaglio">
            <div>
              <label htmlFor={p("description")} className={uiFormLabel}>
                Descrizione
              </label>
              <textarea
                id={p("description")}
                name="description"
                required
                disabled={pending}
                rows={4}
                className={cn(inputClass, "min-h-[100px] resize-y")}
                placeholder="Contesto, esigenze, vincoli…"
              />
            </div>
          </FormSection>

          <FormSection title="Prossimo passo">
            <div className="space-y-3">
              <div>
                <label htmlFor={p("nextAction")} className={uiFormLabel}>
                  Prossima azione
                </label>
                <input
                  id={p("nextAction")}
                  name="nextAction"
                  disabled={pending}
                  className={inputClass}
                  placeholder="Cosa fare dopo"
                />
              </div>
              <div>
                <label htmlFor={p("nextActionAt")} className={uiFormLabel}>
                  Scadenza prossima azione{" "}
                  <span className="font-normal text-slate-400">(opzionale)</span>
                </label>
                <input
                  id={p("nextActionAt")}
                  name="nextActionAt"
                  type="datetime-local"
                  disabled={pending}
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className="shrink-0 border-t border-slate-200/90 bg-white pr-3.5 sm:pr-5 pt-4 dark:border-slate-800 dark:bg-slate-900">
          {error ? (
            <p
              role="alert"
              className="mb-3 text-sm leading-relaxed text-rose-700 dark:text-rose-300"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              className={cn(uiBtnSecondary, "w-full sm:w-auto")}
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
              {pending ? "Creazione…" : "Crea richiesta"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
