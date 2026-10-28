"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cx } from "@/lib/cx";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  defaultVisible?: boolean;
};

export function PasswordInput({
  className,
  defaultVisible = false,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <div className="input-ic has-eye">
      <Lock aria-hidden="true" />
      <input
        className={cx("input", className)}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        className="eye"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  );
}
