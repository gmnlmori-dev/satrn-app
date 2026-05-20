import { StatTile, MetricRow } from "@/components/ui/stat-tile";
import type { DashboardMineCounts } from "@/lib/supabase/dashboard-queries";
import { uiSectionTitle } from "@/lib/typography";

export function DashboardMyWorkStrip({ counts }: { counts: DashboardMineCounts }) {
  return (
    <section className="space-y-2">
      <h2 className={uiSectionTitle}>Il mio lavoro</h2>
      <MetricRow columns={3}>
        <StatTile
          label="In ritardo"
          value={counts.overdue}
          href="/app/follow-up?scope=mine#follow-up-overdue"
          variant="danger"
        />
        <StatTile
          label="Oggi"
          value={counts.today}
          href="/app/follow-up?scope=mine#follow-up-today"
          variant="accent"
        />
        <StatTile
          label="Prossimi 7 giorni"
          value={counts.upcomingWeek}
          href="/app/follow-up?scope=mine#follow-up-upcoming"
        />
      </MetricRow>
    </section>
  );
}
