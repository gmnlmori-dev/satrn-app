import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiBtnSecondary } from "@/lib/ui-classes";
import { uiPageLead } from "@/lib/typography";

export function DashboardHeader() {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Centro di controllo
          </h2>
          <p className={cn(uiPageLead, "mt-1.5 max-w-xl")}>
            Cosa richiede attenzione oggi e cosa è stato aggiornato di recente
            sulla coda.
          </p>
        </div>
        <Link
          href="/app/requests"
          className={cn(
            uiBtnSecondary,
            "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm"
          )}
        >
          Vai alla scrivania richieste
        </Link>
      </div>
    </div>
  );
}
