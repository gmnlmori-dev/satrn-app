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

const sizeClass: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "",
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
  const base = variantClass[variant];
  const sz = variant === "icon" ? "h-9 w-9 p-0" : sizeClass[size];
  return (
    <button
      type="button"
      className={cn(base, sz, className)}
      {...props}
    >
      {children}
    </button>
  );
}
