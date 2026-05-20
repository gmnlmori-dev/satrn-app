import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function InboxLoading() {
  return (
    <div className={cn(uiPanel, "min-h-[14rem] p-4")}>
      <Bone className="h-full min-h-[12rem] w-full" />
    </div>
  );
}
