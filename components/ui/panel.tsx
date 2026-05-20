import { cn } from "@/lib/cn";
import { uiPanel, uiPanelElevated } from "@/lib/surfaces";

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
        elevated ? uiPanelElevated : uiPanel,
        padding && "p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** @deprecated Use Panel */
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
