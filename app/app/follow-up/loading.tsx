import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function FollowUpLoading() {
  return (
    <div className="space-y-8">
      <Bone className="h-14 w-full max-w-lg" />
      <Bone className="h-10 w-48" />
      <div className="space-y-6">
        <Bone className="h-8 w-40" />
        <div className={cn(uiPanel, "min-h-[8rem] p-4")}>
          <Bone className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
