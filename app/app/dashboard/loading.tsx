import { cn } from "@/lib/cn";

function Sk({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/90 dark:bg-slate-700/80",
        className
      )}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-5 md:space-y-6" aria-busy aria-live="polite">
      <div className="space-y-2">
        <Sk className="h-8 w-48 max-w-full" />
        <Sk className="h-4 w-full max-w-md" />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4 dark:divide-slate-800">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex min-h-[7rem] flex-col px-4 py-4 md:px-5 md:py-5">
              <Sk className="h-3 w-20" />
              <Sk className="mt-3 h-9 w-14" />
              <Sk className="mt-2 h-4 w-full max-w-[12rem]" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
        <Sk className="min-h-[12rem] rounded-xl" />
        <Sk className="min-h-[12rem] rounded-xl" />
      </div>
    </div>
  );
}
