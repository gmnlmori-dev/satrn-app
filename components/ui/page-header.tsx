import { cn } from "@/lib/cn";
import { uiPageLead, uiPageTitle } from "@/lib/typography";

export function PageHeader({
  title,
  lead,
  actions,
  className,
}: {
  title: string;
  lead?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className={uiPageTitle}>{title}</h1>
        {lead ? <p className={cn(uiPageLead, "mt-1 max-w-2xl")}>{lead}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
