import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiCard, uiCardElevated } from "@/lib/surfaces";
import { uiCaption, uiSectionDesc, uiSectionTitle } from "@/lib/typography";
import type {
  DashboardMineCounts,
  DashboardMineTaskCounts,
  DashboardOperationalCounts,
  DashboardStandaloneTaskCounts,
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

function windowCountDetail(taskCounts: DashboardMineTaskCounts): string {
  const parts: string[] = [];
  if (taskCounts.overdue > 0) parts.push(`${taskCounts.overdue} in ritardo`);
  if (taskCounts.today > 0) parts.push(`${taskCounts.today} oggi`);
  if (taskCounts.upcomingWeek > 0) {
    parts.push(`${taskCounts.upcomingWeek} nei prossimi 7 giorni`);
  }
  if (parts.length > 0) return parts.join(" · ");
  return `${taskCounts.openTotal} aperte senza scadenza`;
}

function ChecklistHint({ taskCounts }: { taskCounts: DashboardMineTaskCounts }) {
  if (taskCounts.openTotal === 0) {
    return (
      <p className="text-xs text-fg-tertiary">
        Nessuna checklist aperta sui progetti assegnati.
      </p>
    );
  }

  return (
    <p className="text-xs text-fg-tertiary">
      <span className="font-medium text-fg-secondary">Checklist su progetti:</span>{" "}
      {windowCountDetail(taskCounts)}
    </p>
  );
}

function StandaloneTasksPanel({
  taskCounts,
  scope = "mine",
}: {
  taskCounts: DashboardStandaloneTaskCounts;
  scope?: "mine" | "team";
}) {
  const prefix = scope === "mine" ? "/app/follow-up?scope=mine" : "/app/follow-up";

  if (taskCounts.openTotal === 0) {
    return (
      <div className="mt-4 border-t border-line-default pt-4">
        <p className="text-xs font-medium text-fg-secondary">Task libere</p>
        <p className="mt-1 text-xs text-fg-tertiary">
          Nessuna task libera aperta{scope === "mine" ? " assegnata a te" : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-line-default pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-fg-secondary">Task libere</p>
        <Link
          href="/app/tasks"
          className="text-xs text-accent underline-offset-2 hover:underline"
        >
          Apri Task
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        <Metric
          label="In ritardo"
          value={taskCounts.overdue}
          href={`${prefix}#follow-up-tasks-overdue`}
          danger
        />
        <Metric
          label="Oggi"
          value={taskCounts.today}
          href={`${prefix}#follow-up-tasks-today`}
        />
        <Metric
          label="Prossimi 7 giorni"
          value={taskCounts.upcomingWeek}
          href={`${prefix}#follow-up-tasks-upcoming`}
        />
      </div>
      <p className="mt-2 text-xs text-fg-tertiary">
        {windowCountDetail(taskCounts)}
      </p>
    </div>
  );
}

type Props = {
  mineCounts: DashboardMineCounts | null;
  mineTaskCounts: DashboardMineTaskCounts | null;
  mineStandaloneTaskCounts: DashboardStandaloneTaskCounts | null;
  teamStandaloneTaskCounts?: DashboardStandaloneTaskCounts | null;
  queueCounts: DashboardOperationalCounts;
  teamScoped?: boolean;
  inboxEnabled?: boolean;
};

export function DashboardQueueOverview({
  mineCounts,
  mineTaskCounts,
  mineStandaloneTaskCounts,
  teamStandaloneTaskCounts = null,
  queueCounts,
  teamScoped = false,
  inboxEnabled = false,
}: Props) {
  const queueLabel = teamScoped ? "Coda del team" : "Tutta la coda";
  const queueHint = teamScoped
    ? inboxEnabled
      ? "Progetti e inbox del team, escluso il tuo focus personale."
      : "Progetti del team, escluso il tuo focus personale."
    : inboxEnabled
      ? "Panoramica globale di progetti e inbox visibili."
      : "Panoramica globale dei progetti visibili.";

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
                  Progetti assegnati a te
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

            {mineTaskCounts ? (
              <div className="mt-4 border-t border-line-default pt-4">
                <ChecklistHint taskCounts={mineTaskCounts} />
              </div>
            ) : null}
            {mineStandaloneTaskCounts ? (
              <StandaloneTasksPanel
                taskCounts={mineStandaloneTaskCounts}
                scope="mine"
              />
            ) : null}
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

          <div
            className={cn(
              "mt-5 grid grid-cols-2 gap-2 sm:gap-3",
              inboxEnabled ? "sm:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
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
            {inboxEnabled ? (
              <Metric
                label="Inbox triage"
                value={queueCounts.inboxTriage}
                href="/app/follow-up#follow-up-inbox"
              />
            ) : null}
          </div>
          {teamStandaloneTaskCounts &&
          teamStandaloneTaskCounts.openTotal > 0 ? (
            <div className="mt-4 border-t border-line-default pt-4">
              <p className="text-xs font-medium text-fg-secondary">
                Task libere aperte (team)
              </p>
              <p className="mt-1 text-sm tabular-nums font-semibold text-fg-primary">
                {teamStandaloneTaskCounts.openTotal}
              </p>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
