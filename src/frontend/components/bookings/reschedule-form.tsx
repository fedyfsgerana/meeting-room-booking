"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type SyntheticEvent } from "react";
import {
  checkAvailabilityAction,
  rescheduleBookingAction,
} from "@/backend/bookings/actions";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/frontend/components/ui/card";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Input } from "@/frontend/components/ui/field";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { formatLongDate } from "@/lib/format";
import type {
  Availability,
  BookingField,
  RescheduleInput,
} from "@/lib/schemas/booking";
import { minutesToTime, timeToMinutes } from "@/lib/settings";
import { formatClock, formatDuration } from "@/lib/time";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

export type RescheduleBooking = {
  id: number;
  roomId: number;
  roomName: string;
  topic: string;
  date: string;
  startMinute: number;
  endMinute: number;
  departmentName: string;
  departmentCode: string;
  approverName: string;
  teleconference: boolean;
  teleApp: string | null;
  host: boolean | null;
  counterpart: string | null;
};

type RescheduleFormProps = {
  booking: RescheduleBooking;
  today: string;
  openMinute: number;
  closeMinute: number;
  returnQuery: string;
};

const AVAILABILITY_TONE = {
  ok: "success",
  bad: "error",
  wait: "wait",
} as const;

export function RescheduleForm({
  booking,
  today,
  openMinute,
  closeMinute,
  returnQuery,
}: RescheduleFormProps) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<BookingField, string>>>(
    {},
  );
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<RescheduleInput | null>(
    null,
  );
  const [date, setDate] = useState(booking.date < today ? today : booking.date);
  const [start, setStart] = useState(minutesToTime(booking.startMinute));
  const [end, setEnd] = useState(minutesToTime(booking.endMinute));
  const [availability, setAvailability] = useState<Availability>({
    state: "wait",
    message: "Memeriksa ketersediaan ruang…",
  });

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await checkAvailabilityAction(
        {
          roomId: String(booking.roomId),
          date,
          startMinute: start,
          endMinute: end,
        },
        booking.id,
      );
      if (!cancelled) setAvailability(result);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [booking.roomId, booking.id, date, start, end]);

  const startMinute = timeToMinutes(start);
  const endMinute = timeToMinutes(end);
  const duration =
    !Number.isNaN(startMinute) &&
    !Number.isNaN(endMinute) &&
    endMinute > startMinute
      ? endMinute - startMinute
      : 0;
  const unchanged =
    date === booking.date &&
    startMinute === booking.startMinute &&
    endMinute === booking.endMinute;

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmInput({ date, startMinute: start, endMinute: end });
  };

  const save = () => {
    if (!confirmInput) return;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = await rescheduleBookingAction(booking.id, confirmInput);
      setConfirmInput(null);
      if (result.ok) {
        notify(result.message ?? "Tersimpan.", "success");
        router.push(`/booking/${result.id ?? booking.id}${returnQuery}`);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);
  const tele = booking.teleconference
    ? [
        booking.teleApp ?? "Ya",
        booking.host === null
          ? null
          : booking.host
            ? "sebagai host"
            : "bukan host",
        booking.counterpart,
      ]
        .filter(Boolean)
        .join(", ")
    : "Tidak";

  return (
    <>
      <FormAlert message={alertText} />
      <FormAlert
        message={unchanged ? undefined : availability.message}
        tone={AVAILABILITY_TONE[availability.state]}
      />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader
            title="Jadwal baru"
            description="Hanya tanggal dan jam yang bisa diubah. Booking lama tersimpan sebagai riwayat, dan booking baru kembali menunggu persetujuan penyetuju."
          />
          <CardBody>
            <dl className="info-list reschedule-info">
              <div>
                <dt>Ruang</dt>
                <dd>{booking.roomName}</dd>
              </div>
              <div>
                <dt>Topik</dt>
                <dd>{booking.topic}</dd>
              </div>
              <div>
                <dt>Departemen</dt>
                <dd>
                  {booking.departmentName} ({booking.departmentCode})
                </dd>
              </div>
              <div>
                <dt>Penyetuju</dt>
                <dd>{booking.approverName}</dd>
              </div>
              <div>
                <dt>Teleconference</dt>
                <dd>{tele}</dd>
              </div>
              <div>
                <dt>Jadwal saat ini</dt>
                <dd>
                  {formatLongDate(booking.date)},{" "}
                  {formatClock(booking.startMinute)}–
                  {formatClock(booking.endMinute)}
                </dd>
              </div>
            </dl>
            <div className="grid2">
              <Field
                label="Tanggal"
                htmlFor="reschedule-date"
                required
                error={errors.date}
              >
                <Input
                  id="reschedule-date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
              <div />
              <Field
                label="Jam mulai"
                htmlFor="reschedule-start"
                required
                error={errors.startMinute}
                hint={`Jam operasional ${formatClock(openMinute)}–${formatClock(closeMinute)}`}
              >
                <Input
                  id="reschedule-start"
                  type="time"
                  min={minutesToTime(openMinute)}
                  max={minutesToTime(closeMinute)}
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </Field>
              <Field
                label="Jam selesai"
                htmlFor="reschedule-end"
                required
                error={errors.endMinute}
                hint={
                  duration ? `Durasi ${formatDuration(duration)}` : undefined
                }
              >
                <Input
                  id="reschedule-end"
                  type="time"
                  min={minutesToTime(openMinute)}
                  max={minutesToTime(closeMinute)}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              icon={ACTION_STYLE.reschedule.icon}
              loading={pending}
              disabled={unchanged || availability.state !== "ok"}
            >
              Simpan jadwal baru
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title="Simpan jadwal baru?"
            description={`${booking.roomName}, ${formatLongDate(date)}, ${start}–${end}. Booking lama ditandai "Dijadwalkan ulang".`}
            confirmLabel="Simpan jadwal baru"
            icon={ACTION_STYLE.reschedule.icon}
            tone={ACTION_STYLE.reschedule.modal}
            pending={pending}
            onConfirm={save}
            onClose={() => setConfirmInput(null)}
          />
        )}
      </Card>
    </>
  );
}
