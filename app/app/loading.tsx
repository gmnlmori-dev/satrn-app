import { cn } from "@/lib/cn";
import { uiCard } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function AppLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      <Bone className="h-12 w-full max-w-md" />
      <Bone className={cn(uiCard, "h-24 w-full")} />
      <Bone className={cn(uiCard, "h-72 w-full")} />
    </div>
  );
}
