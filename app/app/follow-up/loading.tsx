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

export default function FollowUpLoading() {
  return (
    <div className="space-y-6 md:space-y-8" aria-busy aria-live="polite">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-48 max-w-full" />
        <SkeletonLine className="h-4 w-full max-w-2xl" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <SkeletonLine className="h-6 w-40" />
          <SkeletonLine className="h-4 w-full max-w-md" />
          <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[0, 1].map((j) => (
                <div key={j} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine className="h-4 w-4/5 max-w-lg" />
                    <SkeletonLine className="h-3 w-1/2 max-w-xs" />
                  </div>
                  <SkeletonLine className="h-8 w-32 shrink-0 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
