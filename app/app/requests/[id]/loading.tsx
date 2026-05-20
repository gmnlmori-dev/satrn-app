import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6">
      <Bone className="h-24 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn(uiPanel, "min-h-[12rem] p-5")}>
          <Bone className="h-full min-h-[10rem]" />
        </div>
        <div className="space-y-6">
          <div className={cn(uiPanel, "min-h-[10rem] p-5")}>
            <Bone className="h-full min-h-[8rem]" />
          </div>
          <div className={cn(uiPanel, "min-h-[8rem] p-5")}>
            <Bone className="h-full min-h-[6rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}
