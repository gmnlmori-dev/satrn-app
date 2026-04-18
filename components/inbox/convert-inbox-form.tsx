"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { convertInboxToRequest } from "@/lib/actions/convert-inbox-to-request";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { InboxItem } from "@/types/inbox";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel, uiSectionHeading } from "@/lib/typography";

const inputClass = cn(
  uiTransition,
  "w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] leading-snug text-slate-900",
  "placeholder:text-slate-500 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-100/10",
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

function defaultsFromInbox(item: InboxItem) {
  return {
    title: item.subject.trim() || "Richiesta da inbox",
    companyName: "",
    contactName: item.senderName.trim(),
    contactEmail: item.senderEmail.trim(),
    source: item.source.trim() || "Inbox",
    description: item.rawContent.trim(),
    nextAction: "",
    nextActionAt: "",
    status: "new" as const,
    priority: "medium" as const,
  };
}

export function ConvertInboxForm({ item }: { item: InboxItem }) {
  const uid = useId();
  const p = (name: string) => `${uid}-${name}`;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pulseTopBar } = useDetailSaveFeedback();
  const d = defaultsFromInbox(item);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    try {
      const result = await convertInboxToRequest(item.id, fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      pulseTopBar();
      router.push(`/app/requests/${result.requestId}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <SurfaceCard className="border-emerald-200/50 dark:border-emerald-900/30">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Converti in richiesta
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        I campi sono precompilati dall&apos;ingresso; completa o modifica prima di salvare.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 divide-y divide-slate-200/90 dark:divide-slate-800"
      >
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
              defaultValue={d.title}
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
                defaultValue={d.companyName}
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
                defaultValue={d.source}
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
                defaultValue={d.contactName}
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
                defaultValue={d.contactEmail}
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
                defaultValue={d.status}
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
                defaultValue={d.priority}
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
              rows={6}
              className={cn(inputClass, "min-h-[120px] resize-y")}
              defaultValue={d.description}
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
                defaultValue={d.nextAction}
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
                defaultValue={d.nextActionAt}
              />
            </div>
          </div>
        </FormSection>

        <div className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          {error ? (
            <p
              role="alert"
              className="mr-auto text-sm leading-relaxed text-rose-700 dark:text-rose-300"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className={cn(
              uiBtnPrimary,
              "w-full sm:w-auto",
              pending && "cursor-wait opacity-90",
            )}
          >
            {pending ? "Conversione…" : "Converti in richiesta"}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
