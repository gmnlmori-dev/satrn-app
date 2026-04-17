import { cn } from "@/lib/cn";

export function SurfaceCard({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/50",
        padding && "p-4 md:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
