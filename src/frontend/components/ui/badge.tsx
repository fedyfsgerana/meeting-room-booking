import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type BadgeTone =
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "gray"
  | "violet"
  | "orange";

type BadgeProps = {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({
  tone = "gray",
  dot = true,
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cx("badge", `b-${tone}`, className)}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
