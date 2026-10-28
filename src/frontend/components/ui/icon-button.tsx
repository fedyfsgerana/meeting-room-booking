import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

export type IconButtonTone = "default" | "info" | "ok" | "warn" | "bad";

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: LucideIcon;
  label: string;
  tone?: IconButtonTone;
  ghost?: boolean;
};

export function IconButton({
  icon: Icon,
  label,
  tone = "default",
  ghost = false,
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        ghost ? "ibtn" : "act",
        tone !== "default" && tone,
        className,
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
