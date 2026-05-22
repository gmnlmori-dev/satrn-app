import { cn } from "@/lib/cn";
import { uiPanel } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <Bone className="h-16 w-full max-w-xl" />
      <Bone className="h-36 w-full" />
      <div className={cn(uiPanel, "grid divide-y divide-line-default sm:grid-cols-2 sm:divide-x sm:divide-y-0")}>
        <Bone className="m-4 h-48" />
        <Bone className="m-4 h-48" />
      </div>
    </div>
  );
}
