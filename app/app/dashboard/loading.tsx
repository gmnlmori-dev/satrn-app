import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Sk({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-panel-hover", className)}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-7" aria-busy aria-live="polite">
      <div className="space-y-2">
        <Sk className="h-8 w-48 max-w-full" />
        <Sk className="h-4 w-full max-w-md" />
      </div>
      <div className={cn(uiPanel, "grid divide-y divide-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4")}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex min-h-[5.5rem] flex-col px-4 py-3.5 md:px-5">
            <Sk className="h-3 w-20" />
            <Sk className="mt-3 h-8 w-14" />
            <Sk className="mt-2 h-3 w-full max-w-[12rem]" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
        <Sk className="min-h-[12rem] rounded-lg" />
        <Sk className="min-h-[12rem] rounded-lg" />
      </div>
    </div>
  );
}
