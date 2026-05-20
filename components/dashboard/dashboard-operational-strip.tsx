import { StatTile, StatTileGrid } from "@/components/ui/stat-tile";
import type { DashboardOperationalCounts } from "@/lib/supabase/dashboard-queries";
import { uiOverline } from "@/lib/typography";

export function DashboardOperationalStrip({
  counts,
}: {
  counts: DashboardOperationalCounts;
}) {
  return (
    <div className="space-y-2">
      <p className={uiOverline}>Operatività generale</p>
      <StatTileGrid columns={4}>
        <StatTile
          label="In ritardo"
          value={counts.overdue}
          hint="Scadenza prima di oggi"
          href="/app/follow-up#follow-up-overdue"
          variant="danger"
        />
        <StatTile
          label="Da seguire oggi"
          value={counts.today}
          hint="Prossima azione oggi"
          href="/app/follow-up#follow-up-today"
        />
        <StatTile
          label="Prossimi 7 giorni"
          value={counts.upcomingWeek}
          hint="Domani → +7 giorni"
          href="/app/follow-up#follow-up-upcoming"
        />
        <StatTile
          label="Inbox da triage"
          value={counts.inboxTriage}
          hint="Nuovo o esaminato"
          href="/app/follow-up#follow-up-inbox"
        />
      </StatTileGrid>
    </div>
  );
}
