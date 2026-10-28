"use client";

import { useState, useTransition } from "react";
import { cancelBookingAction } from "@/backend/bookings/actions";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Textarea } from "@/frontend/components/ui/field";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type CancelDialogProps = {
  bookingId: number;
  summary: string;
  onClose: () => void;
};

export function CancelDialog({
  bookingId,
  summary,
  onClose,
}: CancelDialogProps) {
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const confirm = () => {
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId, reason);
      if (result.ok) {
        onClose();
        notify(result.message ?? "Booking dibatalkan.", "success");
        return;
      }
      if (result.fieldErrors?.reason) {
        setError(result.fieldErrors.reason);
        return;
      }
      onClose();
      notify(result.message ?? "Gagal membatalkan booking.", "warning");
    });
  };

  return (
    <ConfirmDialog
      title="Batalkan booking?"
      description={`${summary}. Ruang langsung dilepas untuk pengguna lain.`}
      confirmLabel="Batalkan booking"
      icon={ACTION_STYLE.cancel.icon}
      tone={ACTION_STYLE.cancel.modal}
      pending={pending}
      onConfirm={confirm}
      onClose={onClose}
    >
      <Field
        label="Alasan pembatalan"
        htmlFor="cancel-reason"
        required
        error={error}
      >
        <Textarea
          id="cancel-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Masukkan alasan pembatalan"
          maxLength={300}
        />
      </Field>
    </ConfirmDialog>
  );
}
