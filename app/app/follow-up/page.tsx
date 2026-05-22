import { Suspense } from "react";
import { FollowUpAssigneeScope } from "@/components/follow-up/follow-up-assignee-scope";
import { FollowUpHashScroll } from "@/components/follow-up/follow-up-hash-scroll";
import {
  getFollowUpTodayRequests,
  getInboxTriageItems,
  getOverdueRequests,
  getUpcomingRequests,
} from "@/lib/supabase/follow-up-queries";
import { getCurrentProfileSummary } from "@/lib/supabase/profile-queries";
import { resolveDefaultAssignScope } from "@/lib/user-preferences";
import { cn } from "@/lib/cn";
import { uiOverline, uiPageLead, uiPageTitle } from "@/lib/typography";

export const metadata = {
  title: "Da seguire",
};

export default async function FollowUpPage() {
  const profile = await getCurrentProfileSummary();
  const [overdue, today, upcoming, inbox] = await Promise.all([
    getOverdueRequests(),
    getFollowUpTodayRequests(),
    getUpcomingRequests(),
    getInboxTriageItems(),
  ]);

  const defaultScope = profile
    ? resolveDefaultAssignScope(profile.preferences, profile.role)
    : "all";

  const totalQueue = overdue.length + today.length + upcoming.length;

  return (
    <div className="space-y-6 pb-12 md:space-y-8 md:pb-16">
      <FollowUpHashScroll />
      <header className="min-w-0">
        <h1 className={uiPageTitle}>
          Da seguire
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Ritardi, scadenze oggi e nei prossimi sette giorni, più inbox da triage
          — tutto in un unico elenco.
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-default pt-4">
          <div>
            <dt className={uiOverline}>
              In coda richieste
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg-primary">
              {totalQueue}
            </dd>
          </div>
          <div>
            <dt className={uiOverline}>
              In ritardo
            </dt>
            <dd
              className={cn(
                "mt-0.5 text-lg font-semibold tabular-nums",
                overdue.length > 0
                  ? "text-danger"
                  : "text-fg-primary",
              )}
            >
              {overdue.length}
            </dd>
          </div>
          <div>
            <dt className={uiOverline}>
              Inbox triage
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg-primary">
              {inbox.length}
            </dd>
          </div>
        </dl>
      </header>
      <Suspense fallback={null}>
        <FollowUpAssigneeScope
          overdue={overdue}
          today={today}
          upcoming={upcoming}
          inbox={inbox}
          currentUserId={profile?.userId ?? ""}
          defaultScope={defaultScope}
        />
      </Suspense>
    </div>
  );
}
