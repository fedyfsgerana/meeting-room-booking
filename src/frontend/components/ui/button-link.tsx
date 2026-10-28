import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import type { ButtonVariant } from "./button";
import type { IconButtonTone } from "./icon-button";

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  variant = "secondary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cx(
        "btn",
        `btn-${variant}`,
        size === "sm" && "btn-sm",
        className,
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </Link>
  );
}

type IconLinkProps = LinkProps & {
  icon: LucideIcon;
  label: string;
  tone?: IconButtonTone;
};

export function IconLink({
  icon: Icon,
  label,
  tone = "default",
  ...props
}: IconLinkProps) {
  return (
    <Link
      className={cx("act", tone !== "default" && tone)}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon aria-hidden="true" />
    </Link>
  );
}
