"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { createInboxItem } from "@/lib/actions/create-inbox-item";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
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

export function InboxNewForm() {
  const uid = useId();
  const p = (name: string) => `${uid}-${name}`;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    try {
      const result = await createInboxItem(fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/app/inbox/${result.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <SurfaceCard className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} className="divide-y divide-slate-200/90 dark:divide-slate-800">
        <FormSection title="Provenienza e oggetto">
          <div className="space-y-3">
            <div>
              <label htmlFor={p("source")} className={uiFormLabel}>
                Canale / fonte
              </label>
              <input
                id={p("source")}
                name="source"
                disabled={pending}
                autoComplete="off"
                className={inputClass}
                placeholder="Es. email, WhatsApp, voce, note…"
              />
            </div>
            <div>
              <label htmlFor={p("subject")} className={uiFormLabel}>
                Oggetto / titolo
              </label>
              <input
                id={p("subject")}
                name="subject"
                required
                disabled={pending}
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Mittente">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={p("senderName")} className={uiFormLabel}>
                Nome
              </label>
              <input
                id={p("senderName")}
                name="senderName"
                disabled={pending}
                autoComplete="name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={p("senderEmail")} className={uiFormLabel}>
                Email
              </label>
              <input
                id={p("senderEmail")}
                name="senderEmail"
                type="email"
                disabled={pending}
                autoComplete="email"
                className={inputClass}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Contenuto grezzo">
          <div>
            <label htmlFor={p("rawContent")} className={uiFormLabel}>
              Testo
            </label>
            <textarea
              id={p("rawContent")}
              name="rawContent"
              required
              disabled={pending}
              rows={10}
              className={cn(inputClass, "min-h-[160px] resize-y font-mono text-[14px] leading-relaxed")}
              placeholder={`Incolla qui l'input completo come arrivato dal canale esterno.`}
            />
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
            type="button"
            className={cn(uiBtnSecondary, "w-full sm:w-auto")}
            disabled={pending}
            onClick={() => router.push("/app/inbox")}
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className={cn(uiBtnPrimary, pending && "cursor-wait opacity-90")}
          >
            {pending ? "Salvataggio…" : "Salva in inbox"}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
