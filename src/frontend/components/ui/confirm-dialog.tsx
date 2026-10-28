"use client";

import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button, type ButtonVariant } from "./button";
import { Modal, type ModalTone } from "./modal";

const VARIANT: Record<ModalTone, ButtonVariant> = {
  primary: "primary",
  success: "success",
  danger: "danger",
  warn: "warn",
};

export type ConfirmSummary = Array<[label: string, value: ReactNode]>;

type ConfirmDialogProps = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  icon: LucideIcon;
  tone?: ModalTone;
  pending?: boolean;
  summary?: ConfirmSummary;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  icon,
  tone = "primary",
  pending = false,
  summary,
  confirmDisabled = false,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      variant="center"
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      onClose={onClose}
    >
      {summary && summary.length > 0 && (
        <dl className="confirm-summary">
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="confirm-body">{children}</div>}
      <div className="status-actions">
        <Button icon={ArrowLeft} onClick={onClose} disabled={pending}>
          Kembali
        </Button>
        <Button
          variant={VARIANT[tone]}
          icon={icon}
          loading={pending}
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
