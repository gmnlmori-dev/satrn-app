import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiOverline } from "@/lib/typography";

export function StatTile({
  label,
  value,
  hint,
  href,
  variant = "default",
}: {
  label: string;
  value: number;
  hint: string;
  href?: string;
  variant?: "default" | "accent" | "danger";
}) {
  const inner = (
    <>
      <p className={uiOverline}>{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums tracking-tight",
          variant === "danger" ? "text-danger" : "text-primary",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-snug text-muted">{hint}</p>
    </>
  );

  const shell = cn(
    uiTransition,
    "flex min-h-[5.5rem] flex-col px-4 py-3.5 outline-none md:px-5",
    variant === "accent" && "bg-accent-muted/50",
    variant === "danger" && "bg-danger-muted/40",
    href && "hover:bg-panel-hover",
  );

  if (href) {
    return (
      <Link href={href} className={cn(shell, uiFocusRingInset)}>
        {inner}
      </Link>
    );
  }

  return <div className={shell}>{inner}</div>;
}

export function StatTileGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const cols =
    columns === 4
      ? "sm:grid-cols-2 xl:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";
  return (
    <div
      className={cn(
        "grid divide-y divide-border-subtle rounded-lg border border-border-subtle bg-panel",
        cols,
        "sm:divide-x sm:divide-y-0",
      )}
    >
      {children}
    </div>
  );
}
