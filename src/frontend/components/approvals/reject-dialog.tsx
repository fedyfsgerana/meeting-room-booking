"use client";

import { useState, useTransition } from "react";
import { rejectBookingAction } from "@/backend/approvals/actions";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Textarea } from "@/frontend/components/ui/field";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type RejectDialogProps = {
  bookingId: number;
  summary: string;
  onClose: () => void;
};

export function RejectDialog({
  bookingId,
  summary,
  onClose,
}: RejectDialogProps) {
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const confirm = () => {
    startTransition(async () => {
      const result = await rejectBookingAction(bookingId, reason);
      if (result.ok) {
        onClose();
        notify(result.message ?? "Booking ditolak.", "success");
        return;
      }
      if (result.fieldErrors?.reason) {
        setError(result.fieldErrors.reason);
        return;
      }
      onClose();
      notify(result.message ?? "Gagal menolak booking.", "warning");
    });
  };

  return (
    <ConfirmDialog
      title="Tolak booking?"
      description={`${summary}. Ruang langsung dilepas untuk pengguna lain.`}
      confirmLabel="Tolak booking"
      icon={ACTION_STYLE.reject.icon}
      tone={ACTION_STYLE.reject.modal}
      pending={pending}
      onConfirm={confirm}
      onClose={onClose}
    >
      <Field
        label="Alasan penolakan"
        htmlFor="reject-reason"
        required
        error={error}
        hint="Tulis singkat agar pemesan tahu langkah berikutnya."
      >
        <Textarea
          id="reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Masukkan alasan penolakan"
          maxLength={300}
        />
      </Field>
    </ConfirmDialog>
  );
}
