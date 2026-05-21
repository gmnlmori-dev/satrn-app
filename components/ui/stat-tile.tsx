import Link from "next/link";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiCaption } from "@/lib/typography";
import { uiMetricRow } from "@/lib/surfaces";

export function StatTile({
  label,
  value,
  hint,
  href,
  variant = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  variant?: "default" | "danger" | "accent";
}) {
  const inner = (
    <>
      <p className={uiCaption}>{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums tracking-tight",
          variant === "danger" && "text-danger",
          variant === "accent" && "text-accent",
          variant === "default" && "text-fg-primary",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-fg-tertiary">{hint}</p> : null}
    </>
  );

  const cell = cn(
    uiTransition,
    "flex min-h-[4.75rem] flex-col justify-center px-4 py-3 outline-none md:px-5",
    href && "hover:bg-elevated",
  );

  if (href) {
    return (
      <Link href={href} className={cn(cell, uiFocusRingInset)}>
        {inner}
      </Link>
    );
  }
  return <div className={cell}>{inner}</div>;
}

export function MetricRow({
  children,
  columns = 4,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={cn(uiMetricRow, "grid divide-y divide-line-default", cols, "sm:divide-x sm:divide-y-0")}>
      {children}
    </div>
  );
}

/** @deprecated use MetricRow */
export function StatTileGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}) {
  return <MetricRow columns={columns}>{children}</MetricRow>;
}
