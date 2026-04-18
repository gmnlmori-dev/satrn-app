import { cn } from "@/lib/cn";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/90 dark:bg-slate-700/80",
        className,
      )}
    />
  );
}

export default function InboxLoading() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <SkeletonLine className="h-8 w-48 max-w-full" />
          <SkeletonLine className="h-4 w-full max-w-xl" />
        </div>
        <SkeletonLine className="h-10 w-36 shrink-0" />
      </header>
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-4 w-4/5 max-w-lg" />
                <SkeletonLine className="h-3 w-3/5 max-w-md" />
              </div>
              <SkeletonLine className="h-6 w-24 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
