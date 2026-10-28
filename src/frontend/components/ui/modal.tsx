"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

export type ModalTone = "primary" | "success" | "danger" | "warn";

type ModalProps = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: ModalTone;
  size?: "md" | "lg";
  variant?: "default" | "center";
  onClose: () => void;
  children: ReactNode;
};

const CENTER_TONE: Record<ModalTone, string> = {
  primary: "info",
  success: "success",
  danger: "error",
  warn: "warning",
};

export function Modal({
  title,
  description,
  icon: Icon,
  tone = "primary",
  size = "md",
  variant = "default",
  onClose,
  children,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const field = dialog?.querySelector<HTMLElement>(
      "input:not([type=hidden]), textarea",
    );
    if (field) field.focus();
    else if (variant === "center") dialog?.focus();
    else dialog?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [variant]);

  if (variant === "center") {
    return createPortal(
      <div
        className="backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="status-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          ref={dialogRef}
        >
          <button
            type="button"
            className="status-close"
            aria-label="Tutup"
            title="Tutup"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
          {Icon && (
            <span className={cx("status-ic", CENTER_TONE[tone])}>
              <Icon aria-hidden="true" />
            </span>
          )}
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
          {children}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cx("modal", size === "lg" && "modal-lg")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <div className={cx("modal-head", Icon && "ask")}>
          {Icon && (
            <span className={cx("ask-ic", tone)}>
              <Icon aria-hidden="true" />
            </span>
          )}
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
