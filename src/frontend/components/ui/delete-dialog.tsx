"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { ACTION_STYLE } from "./action-style";
import { ConfirmDialog, type ConfirmSummary } from "./confirm-dialog";
import { Field, Textarea } from "./field";

type DeleteDialogProps = {
  title: string;
  description: string;
  summary?: ConfirmSummary;
  confirmLabel?: string;
  pending: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

export function DeleteDialog({
  title,
  description,
  summary,
  confirmLabel = "Hapus",
  pending,
  error,
  onConfirm,
  onClose,
}: DeleteDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      title={title}
      description={description}
      summary={summary}
      confirmLabel={confirmLabel}
      icon={ACTION_STYLE.delete.icon}
      tone={ACTION_STYLE.delete.modal}
      pending={pending}
      confirmDisabled={reason.trim().length < 3}
      onConfirm={() => onConfirm(reason)}
      onClose={onClose}
    >
      <Field
        label="Alasan penghapusan"
        htmlFor="delete-reason"
        required
        error={error}
      >
        <Textarea
          id="delete-reason"
          rows={2}
          value={reason}
          maxLength={300}
          placeholder="Masukkan alasan penghapusan"
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <p className="confirm-note">
        <Info aria-hidden="true" />
        Alasan tersimpan di Riwayat aktivitas.
      </p>
    </ConfirmDialog>
  );
}
