import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Sk({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-panel-hover", className)} />;
}

export default function FollowUpLoading() {
  return (
    <div className="space-y-6 md:space-y-8" aria-busy aria-live="polite">
      <Sk className="h-8 w-40" />
      <Sk className="h-4 w-full max-w-lg" />
      <div className={cn(uiPanel, "h-14")} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <Sk className="h-6 w-32" />
          <div className={cn(uiPanel, "min-h-[8rem]")} />
        </div>
      ))}
    </div>
  );
}
