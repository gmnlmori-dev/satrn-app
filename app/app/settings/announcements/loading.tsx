import { cn } from "@/lib/cn";
import { dataTableShellClass } from "@/lib/table-ui";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-elevated", className)} />;
}

export default function AdminAnnouncementsSettingsLoading() {
  return (
    <div className="space-y-6 md:space-y-7">
      <Bone className="h-10 w-full max-w-2xl" />
      <Bone className={cn(dataTableShellClass, "h-64 w-full")} />
    </div>
  );
}
