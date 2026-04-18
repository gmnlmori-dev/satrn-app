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

  return (
    <div className="space-y-6 md:space-y-8">
      <FollowUpHashScroll />
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Da seguire
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Ritardi, scadenze oggi e nei prossimi sette giorni, più inbox da
          triage — senza uscire dalla coda operativa.
        </p>
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
