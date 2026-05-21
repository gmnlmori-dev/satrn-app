import { cn } from "@/lib/cn";
import { uiCaption } from "@/lib/typography";

export function SettingsGroup({
  title,
  footer,
  children,
  className,
}: {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {title ? (
        <h2 className={cn(uiCaption, "mb-2 px-1 uppercase tracking-wider text-fg-tertiary")}>
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-line-default bg-surface divide-y divide-line-default">
        {children}
      </div>
      {footer ? (
        <div className="mt-2.5 px-1 text-xs leading-relaxed text-fg-tertiary">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  control,
  disabled,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3.5",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[15px] font-medium leading-snug text-fg-primary">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-sm leading-snug text-fg-secondary">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
