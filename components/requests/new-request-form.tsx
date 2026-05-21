"use client";

import { useEffect, useId, useState } from "react";
import { AdminCreateTeamSelect } from "@/components/app/admin-create-team-select";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { CreateRequestAssigneeSelect } from "@/components/requests/create-request-assignee-select";
import { createRequest } from "@/lib/actions/create-request";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { NextActionField } from "@/components/requests/next-action-field";
import { NextActionDeadlineFields } from "@/components/requests/next-action-deadline-fields";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiControl, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel, uiSectionHeading } from "@/lib/typography";

const inputClass = cn(uiControl, "py-2.5 text-[15px]");

function RequiredMark() {
  return <span className="text-danger">*</span>;
}

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
  const me = useOptionalCurrentProfile();
  const uid = useId();
  const p = (name: string) => `${uid}-${name}`;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createTeamId, setCreateTeamId] = useState(me?.teamId ?? "");
  const [nextAction, setNextAction] = useState("");
  const { pulseTopBar } = useDetailSaveFeedback();

  useEffect(() => {
    if (me?.teamId) setCreateTeamId(me.teamId);
  }, [me?.teamId]);

  const assigneeTeamId =
    me?.role === "admin" ? createTeamId : (me?.teamId ?? "");

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
      setNextAction("");
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
        <div className="min-h-0 flex-1 divide-y divide-line-default overflow-y-auto pb-4 pr-3.5 sm:pr-5">
          <FormSection title="Richiesta">
            <div>
              <label htmlFor={p("title")} className={uiFormLabel}>
                Titolo <RequiredMark />
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
                  disabled={pending}
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Classificazione">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminCreateTeamSelect
                idPrefix={p("create")}
                disabled={pending}
                inputClass={inputClass}
                teamId={createTeamId}
                onTeamChange={setCreateTeamId}
              />
              <CreateRequestAssigneeSelect
                teamId={assigneeTeamId}
                idPrefix={p("create")}
                disabled={pending}
                inputClass={inputClass}
              />
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
                <p className={uiFormLabel}>Prossima azione</p>
                <NextActionField
                  idPrefix={p("nextAction")}
                  name="nextAction"
                  value={nextAction}
                  onChange={setNextAction}
                  disabled={pending}
                  textRows={3}
                  className="mt-1.5"
                />
              </div>
              <NextActionDeadlineFields
                idPrefix={p("nextActionAt")}
                disabled={pending}
                inputClass={inputClass}
              />
            </div>
          </FormSection>
        </div>

        <div className="shrink-0 border-t border-line-default bg-surface pr-3.5 sm:pr-5 pt-4">
          {error ? (
            <p
              role="alert"
              className="mb-3 text-sm leading-relaxed text-danger"
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
