import { cn } from "@/lib/cn";
import { uiCard } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      <Bone className="h-16 w-full max-w-xl" />
      <Bone className={cn(uiCard, "h-24 w-full")} />
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <Bone className={cn(uiCard, "h-56 lg:col-span-7")} />
        <Bone className={cn(uiCard, "h-56 lg:col-span-5")} />
      </div>
      <Bone className={cn(uiCard, "h-14 w-full")} />
    </div>
  );
}
