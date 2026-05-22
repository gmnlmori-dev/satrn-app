import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function CalendarLoading() {
  return (
    <div className="space-y-5">
      <Bone className="h-16 w-full max-w-xl" />
      <div className={cn(uiPanel, "p-5")}>
        <Bone className="h-10 w-full" />
        <Bone className="mt-4 h-9 w-64" />
      </div>
      <div className={cn(uiPanel, "min-h-[20rem] p-4")}>
        <Bone className="h-full min-h-[16rem] w-full" />
      </div>
    </div>
  );
}
