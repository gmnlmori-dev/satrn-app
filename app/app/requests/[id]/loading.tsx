import { cn } from "@/lib/cn";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/90 dark:bg-slate-700/80",
        className
      )}
    />
  );
}

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6 md:space-y-7" aria-busy aria-live="polite">
      <header className="rounded-xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900/45 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-8 w-full max-w-xl" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-md" />
          </div>
          <div className="flex shrink-0 gap-2 self-start sm:pt-0.5">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="min-h-[120px] w-full rounded-xl" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="min-h-[80px] w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
