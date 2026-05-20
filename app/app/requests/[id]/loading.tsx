import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Sk({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-panel-hover", className)} />;
}

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <Sk className="h-8 w-full max-w-xl" />
      <div className={cn(uiPanel, "min-h-[12rem]")} />
      <div className={cn(uiPanel, "min-h-[10rem]")} />
    </div>
  );
}
