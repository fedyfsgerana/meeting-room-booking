"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, Clock, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

export const FIELD_ALERT = "Periksa kembali isian yang ditandai merah.";

export type AlertTone = "error" | "success" | "warning" | "info" | "wait";

const ICONS: Record<AlertTone, LucideIcon> = {
  error: CircleAlert,
  success: CircleCheck,
  warning: TriangleAlert,
  info: Info,
  wait: Clock,
};

type FormAlertProps = {
  message?: string;
  tone?: AlertTone;
  onClose?: () => void;
  id?: string;
};

export function FormAlert({ message, tone = "error", onClose, id }: FormAlertProps) {
  const [dismissed, setDismissed] = useState<string>();

  if (!message && dismissed) setDismissed(undefined);
  if (!message || message === dismissed) return null;

  const Icon = ICONS[tone];

  return (
    <div className={cx("form-alert", tone)} role={tone === "error" ? "alert" : "status"} id={id}>
      <Icon aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        className="form-alert-close"
        aria-label="Tutup pesan"
        title="Tutup"
        onClick={() => (onClose ? onClose() : setDismissed(message))}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
