import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function RequestsLoading() {
  return (
    <div className="space-y-5">
      <div className={cn(uiPanel, "p-5")}>
        <Bone className="h-10 w-full" />
        <Bone className="mt-4 h-9 w-64" />
      </div>
      <div className={cn(uiPanel, "min-h-[16rem] p-4")}>
        <Bone className="h-full min-h-[12rem] w-full" />
      </div>
    </div>
  );
}
