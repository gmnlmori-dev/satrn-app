import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "danger" | "warning" | "success";

const toneClass: Record<Tone, string> = {
  neutral:
    "border-line-default bg-surface text-fg-secondary",
  accent: "border-accent/30 bg-accent-muted text-accent",
  danger: "border-danger/30 bg-danger-muted text-danger",
  warning: "border-warning/30 bg-warning-muted text-warning-fg",
  success: "border-success/30 bg-success-muted text-success",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
