import Link from "next/link";
import type { DashboardMineCounts } from "@/lib/supabase/dashboard-queries";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiOverline } from "@/lib/typography";

type Cell = {
  label: string;
  value: number;
  hint: string;
  href: string;
};

export function DashboardMyWorkStrip({ counts }: { counts: DashboardMineCounts }) {
  const cells: Cell[] = [
    {
      label: "Le mie in ritardo",
      value: counts.overdue,
      hint: "Assegnate a te, scadute",
      href: "/app/follow-up?scope=mine#follow-up-overdue",
    },
    {
      label: "Le mie oggi",
      value: counts.today,
      hint: "Prossima azione oggi",
      href: "/app/follow-up?scope=mine#follow-up-today",
    },
    {
      label: "Le mie · 7 giorni",
      value: counts.upcomingWeek,
      hint: "Domani → +7 giorni",
      href: "/app/follow-up?scope=mine#follow-up-upcoming",
    },
  ];

  return (
    <div className="space-y-2">
      <p className={uiOverline}>Il mio lavoro</p>
      <div className="overflow-hidden rounded-xl border border-slate-900/10 bg-slate-900/[0.03] dark:border-slate-100/10 dark:bg-slate-100/[0.04]">
        <div className="grid divide-y divide-slate-200/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
          {cells.map((cell) => (
            <Link
              key={cell.label}
              href={cell.href}
              className={cn(
                uiTransition,
                uiFocusRingInset,
                "group flex min-h-[6.5rem] flex-col px-4 py-4 outline-none md:px-5",
                "hover:bg-slate-900/[0.04] dark:hover:bg-slate-100/[0.06]",
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
    </div>
  );
}
