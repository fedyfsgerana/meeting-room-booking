"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { CancelDialog } from "./cancel-dialog";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type BookingActionsProps = {
  bookingId: number;
  summary: string;
  canReschedule: boolean;
  canCancel: boolean;
  returnQuery?: string;
};

export function BookingActions({
  bookingId,
  summary,
  canReschedule,
  canCancel,
  returnQuery = "",
}: BookingActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {canReschedule && (
        <ButtonLink
          href={`/booking/${bookingId}/jadwal-ulang${returnQuery}`}
          variant={ACTION_STYLE.reschedule.button}
          icon={ACTION_STYLE.reschedule.icon}
        >
          Jadwalkan ulang
        </ButtonLink>
      )}
      {canCancel && (
        <Button
          variant={ACTION_STYLE.cancel.button}
          icon={ACTION_STYLE.cancel.icon}
          onClick={() => setOpen(true)}
        >
          Batalkan
        </Button>
      )}
      {open && (
        <CancelDialog
          bookingId={bookingId}
          summary={summary}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
