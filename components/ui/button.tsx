import { cn } from "@/lib/cn";
import {
  uiBtnDanger,
  uiBtnGhost,
  uiBtnIcon,
  uiBtnPrimary,
  uiBtnSecondary,
} from "@/lib/ui-classes";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  primary: uiBtnPrimary,
  secondary: uiBtnSecondary,
  ghost: uiBtnGhost,
  danger: uiBtnDanger,
  icon: uiBtnIcon,
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const sz =
    variant === "icon"
      ? ""
      : size === "sm"
        ? "px-2.5 py-1.5 text-xs"
        : "";
  return (
    <button type="button" className={cn(variantClass[variant], sz, className)} {...props}>
      {children}
    </button>
  );
}
