import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

type FieldProps = {
  label: ReactNode;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cx("field", error && "invalid", className)}>
      <label htmlFor={htmlFor}>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? (
        <div className="err" id={`${htmlFor}-error`} role="alert">
          {error}
        </div>
      ) : (
        hint && <div className="hint">{hint}</div>
      )}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & {
  icon?: LucideIcon;
};

export function Input({ icon: Icon, className, ...props }: InputProps) {
  const input = <input className={cx("input", className)} {...props} />;
  if (!Icon) return input;
  return (
    <div className="input-ic">
      <Icon aria-hidden="true" />
      {input}
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx("textarea", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx("select", className)} {...props} />;
}

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
};

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cx("check", className)}>
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}
