import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Sk({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-panel-hover", className)} />;
}

export default function RequestsLoading() {
  return (
    <div className="space-y-6 md:space-y-7" aria-busy aria-live="polite">
      <Sk className="h-8 w-56" />
      <div className={cn(uiPanel, "min-h-[10rem]")} />
      <div className={cn(uiPanel, "min-h-[16rem]")} />
    </div>
  );
}
