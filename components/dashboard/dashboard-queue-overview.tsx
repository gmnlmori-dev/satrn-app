import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiCard, uiCardElevated } from "@/lib/surfaces";
import { uiCaption, uiSectionDesc, uiSectionTitle } from "@/lib/typography";
import type {
  DashboardMineCounts,
  DashboardMineTaskCounts,
  DashboardOperationalCounts,
} from "@/lib/supabase/dashboard-queries";

type MetricProps = {
  label: string;
  value: number;
  href?: string;
  danger?: boolean;
  prominent?: boolean;
};

function Metric({ label, value, href, danger = false, prominent = false }: MetricProps) {
  const numClass = cn(
    "font-semibold tabular-nums tracking-tight",
    prominent ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
    danger && value > 0 ? "text-danger" : "text-fg-primary",
  );

  const content = (
    <>
      <span className={numClass}>{value}</span>
      <span className="mt-1 block text-xs text-fg-tertiary">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          uiTransition,
          uiFocusRingInset,
          "block rounded-xl border border-transparent px-3 py-3 outline-none",
          "hover:border-line-default hover:bg-elevated",
        )}
        aria-label={`${value} ${label.toLowerCase()} — apri in Da seguire`}
      >
        {content}
      </Link>
    );
  }

  return <div className="px-3 py-3">{content}</div>;
}

function TaskHint({ taskCounts }: { taskCounts: DashboardMineTaskCounts }) {
  if (taskCounts.openTotal === 0) {
    return (
      <p className="mt-4 border-t border-line-default pt-3 text-xs text-fg-tertiary">
        Nessuna task checklist aperta sulle richieste assegnate.
      </p>
    );
  }

  const parts: string[] = [];
  if (taskCounts.overdue > 0) {
    parts.push(`${taskCounts.overdue} in ritardo`);
  }
  if (taskCounts.today > 0) {
    parts.push(`${taskCounts.today} oggi`);
  }
  if (taskCounts.upcomingWeek > 0) {
    parts.push(`${taskCounts.upcomingWeek} nei prossimi 7 giorni`);
  }

  const detail =
    parts.length > 0
      ? parts.join(" · ")
      : `${taskCounts.openTotal} aperte senza scadenza`;

  return (
    <p className="mt-4 border-t border-line-default pt-3 text-xs text-fg-tertiary">
      <span className="font-medium text-fg-secondary">Task sulle richieste:</span>{" "}
      {detail}
    </p>
  );
}

type Props = {
  mineCounts: DashboardMineCounts | null;
  mineTaskCounts: DashboardMineTaskCounts | null;
  queueCounts: DashboardOperationalCounts;
  teamScoped?: boolean;
};

export function DashboardQueueOverview({
  mineCounts,
  mineTaskCounts,
  queueCounts,
  teamScoped = false,
}: Props) {
  const queueLabel = teamScoped ? "Coda del team" : "Tutta la coda";
  const queueHint = teamScoped
    ? "Richieste e inbox del team, escluso il tuo focus personale."
    : "Panoramica globale di richieste e inbox visibili.";

  return (
    <section className="space-y-4" aria-label="Panoramica coda">
      <div>
        <h2 className={uiSectionTitle}>Da lavorare adesso</h2>
        <p className={uiSectionDesc}>
          Parti dal tuo carico, poi consulta il resto della coda. I numeri aprono
          la sezione corrispondente in Da seguire.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {mineCounts ? (
          <article
            className={cn(
              uiCardElevated,
              "flex flex-col p-5 sm:p-6 lg:col-span-7",
              "border-accent/20 bg-accent-muted/20",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={uiCaption}>Priorità</p>
                <h3 className="mt-1 text-lg font-semibold text-fg-primary">
                  Il mio lavoro
                </h3>
                <p className="mt-1 text-sm text-fg-secondary">
                  Richieste assegnate a te
                </p>
              </div>
              <Link
                href="/app/follow-up?scope=mine"
                className={cn(
                  uiTransition,
                  uiFocusRingInset,
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted",
                )}
              >
                Apri Da seguire
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <Metric
                label="In ritardo"
                value={mineCounts.overdue}
                href="/app/follow-up?scope=mine#follow-up-overdue"
                danger
                prominent
              />
              <Metric
                label="Oggi"
                value={mineCounts.today}
                href="/app/follow-up?scope=mine#follow-up-today"
                prominent
              />
              <Metric
                label="Prossimi 7 giorni"
                value={mineCounts.upcomingWeek}
                href="/app/follow-up?scope=mine#follow-up-upcoming"
                prominent
              />
            </div>

            {mineTaskCounts ? <TaskHint taskCounts={mineTaskCounts} /> : null}
          </article>
        ) : null}

        <article
          className={cn(
            uiCard,
            "flex flex-col p-5 sm:p-6",
            mineCounts ? "lg:col-span-5" : "lg:col-span-12",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={uiCaption}>Resto del team</p>
              <h3 className="mt-1 text-base font-semibold text-fg-primary">
                {queueLabel}
              </h3>
              <p className="mt-1 text-sm text-fg-secondary">{queueHint}</p>
            </div>
            <Link
              href="/app/follow-up"
              className={cn(
                uiTransition,
                uiFocusRingInset,
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-fg-secondary hover:bg-elevated",
              )}
            >
              Vedi coda
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Metric
              label="In ritardo"
              value={queueCounts.overdue}
              href="/app/follow-up#follow-up-overdue"
              danger
            />
            <Metric
              label="Oggi"
              value={queueCounts.today}
              href="/app/follow-up#follow-up-today"
            />
            <Metric
              label="Prossimi 7 giorni"
              value={queueCounts.upcomingWeek}
              href="/app/follow-up#follow-up-upcoming"
            />
            <Metric
              label="Inbox triage"
              value={queueCounts.inboxTriage}
              href="/app/follow-up#follow-up-inbox"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
