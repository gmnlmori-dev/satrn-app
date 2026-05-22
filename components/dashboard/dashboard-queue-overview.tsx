import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  dataTableColSepClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableShellClass,
  dataTableTdClass,
  dataTableThClass,
} from "@/lib/table-ui";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiSectionDesc, uiSectionTitle } from "@/lib/typography";
import type {
  DashboardMineCounts,
  DashboardOperationalCounts,
} from "@/lib/supabase/dashboard-queries";

type QueueCountLinkProps =
  | { unavailable: true; value?: number; href?: string; danger?: boolean }
  | { unavailable?: false; value: number; href?: string; danger?: boolean };

function QueueCountLink(props: QueueCountLinkProps) {
  if (props.unavailable) {
    return (
      <span className="text-sm text-fg-tertiary" aria-hidden>
        —
      </span>
    );
  }

  const { value, href, danger = false } = props;

  const numClass = cn(
    "text-xl font-semibold tabular-nums tracking-tight",
    danger && value > 0 ? "text-danger" : "text-fg-primary",
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          uiTransition,
          "inline-flex min-h-9 min-w-[2.5rem] items-center justify-center rounded-md px-2 py-1 outline-none",
          "hover:bg-elevated",
          uiFocusRingInset,
        )}
        aria-label={`${value} — apri in Da seguire`}
      >
        <span className={numClass}>{value}</span>
      </Link>
    );
  }

  return <span className={numClass}>{value}</span>;
}

const countThClass = cn(
  dataTableThClass,
  "w-[6.5rem] text-center sm:w-[7.5rem]",
  dataTableColSepClass,
);

const countTdClass = cn(dataTableTdClass, "text-center", dataTableColSepClass);

type Props = {
  mineCounts: DashboardMineCounts | null;
  queueCounts: DashboardOperationalCounts;
  teamScoped?: boolean;
};

export function DashboardQueueOverview({
  mineCounts,
  queueCounts,
  teamScoped = false,
}: Props) {
  const queueLabel = teamScoped ? "Coda del team" : "Tutta la coda";
  const queueHint = teamScoped
    ? "Richieste e inbox del tuo team"
    : "Tutte le richieste e inbox visibili";

  return (
    <section className="space-y-2">
      <div>
        <h2 className={uiSectionTitle}>Panoramica coda</h2>
        <p className={uiSectionDesc}>
          Confronto rapido tra il tuo carico di lavoro e l&apos;intera coda.
          Clicca un numero per aprire la sezione corrispondente in Da seguire.
        </p>
      </div>

      <div className={dataTableShellClass}>
        <table className="w-full min-w-[36rem] table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className={dataTableHeadRowClass}>
              <th scope="col" className={cn(dataTableThClass, "w-[11rem] sm:w-[13rem]")}>
                Ambito
              </th>
              <th scope="col" className={countThClass}>
                In ritardo
              </th>
              <th scope="col" className={countThClass}>
                Oggi
              </th>
              <th scope="col" className={countThClass}>
                Prossimi 7 giorni
              </th>
              <th scope="col" className={countThClass}>
                Inbox triage
              </th>
            </tr>
          </thead>
          <tbody>
            {mineCounts ? (
              <tr className={dataTableRowClass}>
                <th scope="row" className={cn(dataTableTdClass, "font-normal")}>
                  <span className="block font-medium text-fg-primary">
                    Il mio lavoro
                  </span>
                  <span className="mt-0.5 block text-xs text-fg-tertiary">
                    Solo richieste assegnate a te
                  </span>
                </th>
                <td className={countTdClass}>
                  <QueueCountLink
                    value={mineCounts.overdue}
                    href="/app/follow-up?scope=mine#follow-up-overdue"
                    danger
                  />
                </td>
                <td className={countTdClass}>
                  <QueueCountLink
                    value={mineCounts.today}
                    href="/app/follow-up?scope=mine#follow-up-today"
                  />
                </td>
                <td className={countTdClass}>
                  <QueueCountLink
                    value={mineCounts.upcomingWeek}
                    href="/app/follow-up?scope=mine#follow-up-upcoming"
                  />
                </td>
                <td className={countTdClass}>
                  <QueueCountLink unavailable />
                </td>
              </tr>
            ) : null}
            <tr className={dataTableRowClass}>
              <th scope="row" className={cn(dataTableTdClass, "font-normal")}>
                <span className="block font-medium text-fg-primary">
                  {queueLabel}
                </span>
                <span className="mt-0.5 block text-xs text-fg-tertiary">
                  {queueHint}
                </span>
              </th>
              <td className={countTdClass}>
                <QueueCountLink
                  value={queueCounts.overdue}
                  href="/app/follow-up#follow-up-overdue"
                  danger
                />
              </td>
              <td className={countTdClass}>
                <QueueCountLink
                  value={queueCounts.today}
                  href="/app/follow-up#follow-up-today"
                />
              </td>
              <td className={countTdClass}>
                <QueueCountLink
                  value={queueCounts.upcomingWeek}
                  href="/app/follow-up#follow-up-upcoming"
                />
              </td>
              <td className={countTdClass}>
                <QueueCountLink
                  value={queueCounts.inboxTriage}
                  href="/app/follow-up#follow-up-inbox"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
