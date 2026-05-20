import { cn } from "@/lib/cn";
import { uiCard, uiCardElevated } from "@/lib/surfaces";

export function Panel({
  children,
  className,
  padding = true,
  elevated = false,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        elevated ? uiCardElevated : uiCard,
        padding && "p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

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
    <Panel className={className} padding={padding}>
      {children}
    </Panel>
  );
}
