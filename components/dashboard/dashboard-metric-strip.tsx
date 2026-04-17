import type { DashboardStats } from "@/lib/dashboard-stats";
import { uiOverline } from "@/lib/typography";

type Cell = {
  label: string;
  value: number;
  hint?: string;
};

export function DashboardMetricStrip({ stats }: { stats: DashboardStats }) {
  const cells: Cell[] = [
    { label: "Nuove", value: stats.nuove },
    { label: "In valutazione", value: stats.inValutazione },
    {
      label: "Da seguire oggi",
      value: stats.daSeguireOggi,
      hint: "Prossima azione in scadenza oggi",
    },
    { label: "Ferme", value: stats.ferme, hint: "In attesa di input" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4 dark:divide-slate-800">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="flex min-h-[7rem] flex-col px-4 py-4 md:px-5 md:py-5"
          >
            <p className={uiOverline}>{cell.label}</p>
            <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
              {cell.value}
            </p>
            <p
              className="mt-1.5 min-h-[1.25rem] text-sm leading-snug text-slate-600 dark:text-slate-400"
              aria-hidden={!cell.hint}
            >
              {cell.hint ?? " "}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
