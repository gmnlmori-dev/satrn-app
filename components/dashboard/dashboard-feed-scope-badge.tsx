import { Badge } from "@/components/ui/badge";
import type { DashboardFeedScopeTag } from "@/lib/dashboard-feed-scope";

export function DashboardFeedScopeBadge({
  tag,
  className,
}: {
  tag: DashboardFeedScopeTag;
  className?: string;
}) {
  return (
    <span title={tag.title} className="inline-flex">
      <Badge tone={tag.tone} className={className}>
        {tag.label}
      </Badge>
    </span>
  );
}

export function DashboardFeedScopeLegend({
  showOtherTeam = false,
}: {
  showOtherTeam?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-fg-tertiary">Ambito</span>
      <DashboardFeedScopeBadge
        tag={{
          scope: "mine",
          label: "Tu",
          tone: "accent",
          title: "Tua azione o richiesta assegnata a te",
        }}
      />
      <DashboardFeedScopeBadge
        tag={{
          scope: "team",
          label: "Team",
          tone: "neutral",
          title: "Movimento nel tuo team",
        }}
      />
      {showOtherTeam ? (
        <DashboardFeedScopeBadge
          tag={{
            scope: "other-team",
            label: "Altro team",
            tone: "warning",
            title: "Richiesta di un altro team",
          }}
        />
      ) : null}
    </div>
  );
}
