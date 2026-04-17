import { cn } from "@/lib/cn";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/90 dark:bg-slate-700/80",
        className
      )}
    />
  );
}

export default function RequestsLoading() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-2">
          <SkeletonLine className="h-7 w-56 max-w-full" />
          <SkeletonLine className="h-4 w-full max-w-xl" />
        </div>
        <SkeletonLine className="h-10 w-28 shrink-0 self-start" />
      </header>
      <div className="rounded-xl border border-slate-200/60 bg-slate-50/90 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/50">
        <SkeletonLine className="h-3 w-32" />
        <div className="mt-3 flex flex-wrap gap-3">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-4 w-20" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-4 w-40" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 px-4 py-3">
                <SkeletonLine className="h-4 w-8 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonLine className="h-4 w-3/5 max-w-md" />
                  <SkeletonLine className="h-3 w-2/5 max-w-xs" />
                </div>
                <SkeletonLine className="h-6 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
