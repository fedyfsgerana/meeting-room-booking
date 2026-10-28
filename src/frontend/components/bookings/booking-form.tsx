"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type SyntheticEvent } from "react";
import { CalendarCheck } from "lucide-react";
import {
  checkAvailabilityAction,
  createBookingAction,
} from "@/backend/bookings/actions";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/frontend/components/ui/card";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/frontend/components/ui/field";
import { SearchSelect } from "@/frontend/components/ui/search-select";
import { Segmented } from "@/frontend/components/ui/segmented";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { TELE_APPS } from "@/lib/bookings";
import { formatLongDate } from "@/lib/format";
import type {
  Availability,
  BookingField,
  BookingInput,
} from "@/lib/schemas/booking";
import { minutesToTime, timeToMinutes } from "@/lib/settings";
import { formatClock, formatDuration } from "@/lib/time";

export type RoomOption = { id: number; name: string; capacity: number };

export type DepartmentOption = {
  id: number;
  code: string;
  name: string;
  approvers: Array<{ id: number; name: string; job: string }>;
};

type BookingFormProps = {
  rooms: RoomOption[];
  departments: DepartmentOption[];
  defaultDepartmentId: number;
  defaultRoomId?: number;
  defaultDate?: string;
  defaultStart?: string;
  today: string;
  openMinute: number;
  closeMinute: number;
};

const AVAILABILITY_TONE = {
  ok: "success",
  bad: "error",
  wait: "wait",
} as const;

export function BookingForm({
  rooms,
  departments,
  defaultDepartmentId,
  defaultRoomId,
  defaultDate,
  defaultStart,
  today,
  openMinute,
  closeMinute,
}: BookingFormProps) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<BookingField, string>>>(
    {},
  );
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<BookingInput | null>(null);

  const [roomId, setRoomId] = useState(String(defaultRoomId ?? ""));
  const [date, setDate] = useState(defaultDate ?? today);
  const [start, setStart] = useState(defaultStart ?? "");
  const [end, setEnd] = useState("");
  const [departmentId, setDepartmentId] = useState(String(defaultDepartmentId));
  const [approverId, setApproverId] = useState(() => {
    const initial = departments.find((item) => item.id === defaultDepartmentId);
    return initial?.approvers.length === 1 ? String(initial.approvers[0].id) : "";
  });
  const [teleconference, setTeleconference] = useState<"yes" | "no">("no");
  const [host, setHost] = useState<"yes" | "no" | "">("");
  const [availability, setAvailability] = useState<Availability>({
    state: "wait",
    message: "Pilih ruang, tanggal, dan jam untuk mengecek ketersediaan.",
  });

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await checkAvailabilityAction({
        roomId,
        date,
        startMinute: start,
        endMinute: end,
      });
      if (!cancelled) setAvailability(result);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [roomId, date, start, end]);

  const department = departments.find(
    (item) => String(item.id) === departmentId,
  );
  const approverName =
    department?.approvers.find((approver) => String(approver.id) === approverId)
      ?.name ?? "penyetuju";

  const chooseDepartment = (value: string) => {
    setDepartmentId(value);
    const next = departments.find((item) => String(item.id) === value);
    setApproverId(next?.approvers.length === 1 ? String(next.approvers[0].id) : "");
  };
  const startMinute = timeToMinutes(start);
  const endMinute = timeToMinutes(end);
  const duration =
    !Number.isNaN(startMinute) &&
    !Number.isNaN(endMinute) &&
    endMinute > startMinute
      ? endMinute - startMinute
      : 0;
  const room = rooms.find((item) => String(item.id) === roomId);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    setConfirmInput({
      roomId,
      date,
      startMinute: start,
      endMinute: end,
      topic: value("topic"),
      departmentId,
      approverId,
      participants: value("participants"),
      teleconference: teleconference === "yes",
      teleApp: value("teleApp"),
      host,
      counterpart: value("counterpart"),
      notes: value("notes"),
    });
  };

  const save = () => {
    if (!confirmInput) return;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = await createBookingAction(confirmInput);
      setConfirmInput(null);
      if (result.ok) {
        notify(result.message ?? "Tersimpan.", "success");
        router.push(`/booking/${result.id ?? ""}`);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert message={alertText} />
      <FormAlert
        message={availability.message}
        tone={AVAILABILITY_TONE[availability.state]}
      />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader
            title="Data booking"
            description="Booking disimpan sebagai Draft dan menunggu persetujuan penyetuju departemen."
          />
          <CardBody>
            <h3 className="form-section">Ruang dan waktu</h3>
            <div className="grid2">
              <Field
                label="Ruang meeting"
                htmlFor="booking-room"
                required
                error={errors.roomId}
              >
                <SearchSelect
                  id="booking-room"
                  options={rooms.map((item) => ({
                    value: String(item.id),
                    label: `${item.name} (${item.capacity} orang)`,
                  }))}
                  defaultValue={roomId}
                  placeholder="Pilih ruang"
                  onChange={setRoomId}
                />
              </Field>
              <Field
                label="Tanggal"
                htmlFor="booking-date"
                required
                error={errors.date}
              >
                <Input
                  id="booking-date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
              <Field
                label="Jam mulai"
                htmlFor="booking-start"
                required
                error={errors.startMinute}
                hint={`Jam operasional ${formatClock(openMinute)}–${formatClock(closeMinute)}`}
              >
                <Input
                  id="booking-start"
                  type="time"
                  min={minutesToTime(openMinute)}
                  max={minutesToTime(closeMinute)}
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </Field>
              <Field
                label="Jam selesai"
                htmlFor="booking-end"
                required
                error={errors.endMinute}
                hint={
                  duration ? `Durasi ${formatDuration(duration)}` : undefined
                }
              >
                <Input
                  id="booking-end"
                  type="time"
                  min={minutesToTime(openMinute)}
                  max={minutesToTime(closeMinute)}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </Field>
            </div>

            <h3 className="form-section">Detail meeting</h3>
            <Field
              label="Topik pembahasan"
              htmlFor="booking-topic"
              required
              error={errors.topic}
              hint="Contoh: Evaluasi vendor kuartal ketiga."
            >
              <Input
                id="booking-topic"
                name="topic"
                placeholder="Masukkan topik pembahasan"
                maxLength={120}
              />
            </Field>
            <div className="grid2">
              <Field
                label="Departemen"
                htmlFor="booking-department"
                required
                error={errors.departmentId}
                hint={
                  departments.length
                    ? undefined
                    : "Belum ada departemen untuk akun Anda. Hubungi administrator."
                }
              >
                <SearchSelect
                  id="booking-department"
                  options={departments.map((item) => ({
                    value: String(item.id),
                    label: `${item.name} (${item.code})`,
                  }))}
                  defaultValue={departmentId}
                  placeholder="Pilih departemen"
                  onChange={chooseDepartment}
                />
              </Field>
              <Field
                label="Penyetuju yang menyetujui"
                htmlFor="booking-approver"
                required
                error={errors.approverId}
                hint={
                  department && !department.approvers.length
                    ? "Departemen ini belum punya penyetuju. Hubungi administrator."
                    : undefined
                }
              >
                <SearchSelect
                  key={departmentId}
                  id="booking-approver"
                  options={(department?.approvers ?? []).map((approver) => ({
                    value: String(approver.id),
                    label: `${approver.name} (${approver.job})`,
                  }))}
                  defaultValue={approverId}
                  placeholder="Pilih penyetuju"
                  onChange={setApproverId}
                />
              </Field>
              <Field
                label="Jumlah peserta"
                htmlFor="booking-participants"
                error={errors.participants}
                hint={
                  room
                    ? `Kapasitas ${room.name} ${room.capacity} orang`
                    : undefined
                }
              >
                <Input
                  id="booking-participants"
                  name="participants"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  placeholder="Masukkan jumlah peserta"
                />
              </Field>
              <div className="field">
                <span className="label">Teleconference</span>
                <Segmented
                  label="Teleconference"
                  value={teleconference}
                  onChange={setTeleconference}
                  options={[
                    { value: "no", label: "Tidak" },
                    { value: "yes", label: "Ya" },
                  ]}
                />
              </div>
            </div>
            {teleconference === "yes" && (
              <div className="grid2">
                <Field
                  label="Aplikasi teleconference"
                  htmlFor="booking-tele"
                  required
                  error={errors.teleApp}
                >
                  <SearchSelect
                    id="booking-tele"
                    name="teleApp"
                    options={TELE_APPS.map((app) => ({
                      value: app,
                      label: app,
                    }))}
                    defaultValue=""
                    placeholder="Pilih aplikasi"
                  />
                </Field>
                <div className="field">
                  <span className="label">
                    Sebagai host <span className="req">*</span>
                  </span>
                  <Segmented
                    label="Sebagai host"
                    value={host}
                    onChange={setHost}
                    options={[
                      { value: "no", label: "Tidak" },
                      { value: "yes", label: "Ya" },
                    ]}
                  />
                  {errors.host && <div className="err">{errors.host}</div>}
                </div>
                <Field
                  label="Lawan bicara"
                  htmlFor="booking-counterpart"
                  error={errors.counterpart}
                  hint="Opsional. Contoh: PT Mitra Sejahtera atau tim audit pusat."
                >
                  <Input
                    id="booking-counterpart"
                    name="counterpart"
                    placeholder="Masukkan lawan bicara"
                    maxLength={120}
                  />
                </Field>
              </div>
            )}
            <Field
              label="Catatan"
              htmlFor="booking-notes"
              error={errors.notes}
              hint="Opsional. Contoh: kebutuhan konsumsi atau perlengkapan tambahan."
            >
              <Textarea
                id="booking-notes"
                name="notes"
                placeholder="Masukkan catatan"
                maxLength={500}
              />
            </Field>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              icon={CalendarCheck}
              loading={pending}
              disabled={availability.state !== "ok"}
            >
              Ajukan booking
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title="Ajukan booking?"
            description={`${room?.name ?? "Ruang"}, ${date ? formatLongDate(date) : "-"}, ${start}–${end}. Menunggu persetujuan ${approverName}.`}
            confirmLabel="Ajukan booking"
            icon={CalendarCheck}
            pending={pending}
            onConfirm={save}
            onClose={() => setConfirmInput(null)}
          />
        )}
      </Card>
    </>
  );
}
