import { StatTile, StatTileGrid } from "@/components/ui/stat-tile";
import type { DashboardMineCounts } from "@/lib/supabase/dashboard-queries";
import { uiOverline } from "@/lib/typography";

export function DashboardMyWorkStrip({ counts }: { counts: DashboardMineCounts }) {
  return (
    <div className="space-y-2">
      <p className={uiOverline}>Il mio lavoro</p>
      <StatTileGrid columns={3}>
        <StatTile
          label="Le mie in ritardo"
          value={counts.overdue}
          hint="Assegnate a te, scadute"
          href="/app/follow-up?scope=mine#follow-up-overdue"
          variant="danger"
        />
        <StatTile
          label="Le mie oggi"
          value={counts.today}
          hint="Prossima azione oggi"
          href="/app/follow-up?scope=mine#follow-up-today"
          variant="accent"
        />
        <StatTile
          label="Le mie · 7 giorni"
          value={counts.upcomingWeek}
          hint="Domani → +7 giorni"
          href="/app/follow-up?scope=mine#follow-up-upcoming"
        />
      </StatTileGrid>
    </div>
  );
}
