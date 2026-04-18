import Link from "next/link";
import type { DashboardOperationalCounts } from "@/lib/supabase/dashboard-queries";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiOverline } from "@/lib/typography";

type Cell = {
  label: string;
  value: number;
  hint: string;
  href: string;
};

export function DashboardOperationalStrip({
  counts,
}: {
  counts: DashboardOperationalCounts;
}) {
  const cells: Cell[] = [
    {
      label: "In ritardo",
      value: counts.overdue,
      hint: "Scadenza prima di oggi",
      href: "/app/follow-up#follow-up-overdue",
    },
    {
      label: "Da seguire oggi",
      value: counts.today,
      hint: "Prossima azione oggi",
      href: "/app/follow-up#follow-up-today",
    },
    {
      label: "Prossimi 7 giorni",
      value: counts.upcomingWeek,
      hint: "Domani → +7 giorni",
      href: "/app/follow-up#follow-up-upcoming",
    },
    {
      label: "Inbox da triage",
      value: counts.inboxTriage,
      hint: "Nuovo o esaminato",
      href: "/app/follow-up#follow-up-inbox",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4 dark:divide-slate-800">
        {cells.map((cell) => (
          <Link
            key={cell.label}
            href={cell.href}
            className={cn(
              uiTransition,
              uiFocusRingInset,
              "group flex min-h-[7rem] flex-col px-4 py-4 pb-5 outline-none md:px-5 md:py-5",
              "hover:bg-slate-50/90 dark:hover:bg-slate-800/40",
            )}
          >
            <p className={uiOverline}>{cell.label}</p>
            <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 group-hover:text-slate-950 dark:text-slate-50 dark:group-hover:text-white">
              {cell.value}
            </p>
            <p className="mt-1.5 text-sm leading-snug text-slate-600 dark:text-slate-400">
              {cell.hint}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
