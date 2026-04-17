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
    <div className="space-y-8" aria-busy aria-live="polite">
      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full max-w-xl" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
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
