import type { ComponentProps } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "plain" | "danger" | "success" | "warn";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: LucideIcon;
  loading?: boolean;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  loading = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
