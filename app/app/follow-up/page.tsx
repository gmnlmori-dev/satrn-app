import { FollowUpHashScroll } from "@/components/follow-up/follow-up-hash-scroll";
import { FollowUpView } from "@/components/follow-up/follow-up-view";
import {
  getFollowUpTodayRequests,
  getInboxTriageItems,
  getOverdueRequests,
  getUpcomingRequests,
} from "@/lib/supabase/follow-up-queries";
import { cn } from "@/lib/cn";
import { uiPageLead } from "@/lib/typography";

export const metadata = {
  title: "Da seguire",
};

export default async function FollowUpPage() {
  const [overdue, today, upcoming, inbox] = await Promise.all([
    getOverdueRequests(),
    getFollowUpTodayRequests(),
    getUpcomingRequests(),
    getInboxTriageItems(),
  ]);

  const totalQueue = overdue.length + today.length + upcoming.length;

  return (
    <div className="space-y-6 md:space-y-8">
      <FollowUpHashScroll />
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Da seguire
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Ritardi, scadenze oggi e nei prossimi sette giorni, più inbox da triage
          — tutto in un unico elenco.
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200/80 pt-4 dark:border-slate-800">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              In coda richieste
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {totalQueue}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              In ritardo
            </dt>
            <dd
              className={cn(
                "mt-0.5 text-lg font-semibold tabular-nums",
                overdue.length > 0
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-slate-900 dark:text-slate-100",
              )}
            >
              {overdue.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Inbox triage
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {inbox.length}
            </dd>
          </div>
        </dl>
      </header>
      <FollowUpView
        overdue={overdue}
        today={today}
        upcoming={upcoming}
        inbox={inbox}
      />
    </div>
  );
}
