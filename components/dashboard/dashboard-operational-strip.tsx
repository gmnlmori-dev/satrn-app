import { StatTile, MetricRow } from "@/components/ui/stat-tile";
import type { DashboardOperationalCounts } from "@/lib/supabase/dashboard-queries";
import { uiSectionTitle } from "@/lib/typography";

export function DashboardOperationalStrip({
  counts,
  teamScoped = false,
}: {
  counts: DashboardOperationalCounts;
  teamScoped?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className={uiSectionTitle}>
        {teamScoped ? "Coda del team" : "Tutta la coda"}
      </h2>
      <MetricRow columns={4}>
        <StatTile
          label="In ritardo"
          value={counts.overdue}
          href="/app/follow-up#follow-up-overdue"
          variant="danger"
        />
        <StatTile label="Oggi" value={counts.today} href="/app/follow-up#follow-up-today" />
        <StatTile
          label="7 giorni"
          value={counts.upcomingWeek}
          href="/app/follow-up#follow-up-upcoming"
        />
        <StatTile
          label="Inbox triage"
          value={counts.inboxTriage}
          href="/app/follow-up#follow-up-inbox"
        />
      </MetricRow>
    </section>
  );
}
