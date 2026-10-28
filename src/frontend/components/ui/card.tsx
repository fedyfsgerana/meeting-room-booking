import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("card", className)} {...props} />;
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function CardHeader({ title, description, actions }: CardHeaderProps) {
  return (
    <div className="card-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("card-body", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("card-foot", className)} {...props} />;
}
