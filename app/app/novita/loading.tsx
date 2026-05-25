import { cn } from "@/lib/cn";
import { uiCard } from "@/lib/surfaces";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function NovitaLoading() {
  return (
    <div className="space-y-6 pb-12 md:space-y-8 md:pb-16">
      <Bone className="h-16 w-full max-w-xl" />
      <div className="space-y-3">
        <Bone className={cn(uiCard, "h-24 w-full")} />
        <Bone className={cn(uiCard, "h-24 w-full")} />
        <Bone className={cn(uiCard, "h-24 w-full")} />
      </div>
    </div>
  );
}
