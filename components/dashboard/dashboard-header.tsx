import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { uiPageLead, uiPageTitle } from "@/lib/typography";

export function DashboardHeader() {
  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className={uiPageTitle}>
            Home operativa
          </h1>
          <p className={cn(uiPageLead, "mt-1.5 max-w-xl")}>
            Ritardi, scadenze, inbox e ultime attività — punto di partenza per
            lavorare la coda.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/app/follow-up"
            className={cn(
              uiBtnSecondary,
              "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm",
            )}
          >
            Da seguire
          </Link>
          <Link
            href="/app/requests"
            className={cn(
              uiBtnSecondary,
              "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm",
            )}
          >
            Scrivania richieste
          </Link>
        </div>
      </div>
    </Panel>
  );
}
