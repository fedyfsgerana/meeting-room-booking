import { z } from "zod";
import { TELE_APPS } from "@/lib/bookings";
import { timeToMinutes } from "@/lib/settings";

const timeField = (label: string) =>
  z
    .string()
    .transform((value) => timeToMinutes(value))
    .refine((value) => !Number.isNaN(value), `Pilih ${label}.`);

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value ? Number(value) : null))
  .refine(
    (value) =>
      value === null || (Number.isInteger(value) && value >= 1 && value <= 500),
    "Jumlah peserta 1–500 orang.",
  );

export const bookingSchema = z
  .object({
    roomId: z.coerce
      .number({ error: "Pilih ruang." })
      .int()
      .positive("Pilih ruang."),
    date: z.iso.date({ error: "Pilih tanggal." }),
    startMinute: timeField("jam mulai"),
    endMinute: timeField("jam selesai"),
    topic: z
      .string()
      .trim()
      .min(3, "Isi topik minimal 3 karakter.")
      .max(120, "Topik maksimal 120 karakter."),
    departmentId: z.coerce
      .number({ error: "Pilih departemen." })
      .int()
      .positive("Pilih departemen."),
    approverId: z.coerce
      .number({ error: "Pilih penyetuju." })
      .int()
      .positive("Pilih penyetuju yang menyetujui."),
    participants: optionalNumber,
    teleconference: z.boolean(),
    teleApp: z
      .string()
      .trim()
      .max(60)
      .transform((value) => value || null),
    host: z
      .enum(["yes", "no", ""])
      .default("")
      .transform((value) => (value === "" ? null : value === "yes")),
    counterpart: z
      .string()
      .trim()
      .max(120, "Lawan bicara maksimal 120 karakter.")
      .default("")
      .transform((value) => value || null),
    notes: z
      .string()
      .trim()
      .max(500, "Catatan maksimal 500 karakter.")
      .transform((value) => value || null),
  })
  .refine((data) => data.startMinute < data.endMinute, {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["endMinute"],
  })
  .refine(
    (data) =>
      !data.teleconference ||
      (data.teleApp !== null &&
        (TELE_APPS as readonly string[]).includes(data.teleApp)),
    {
      message: "Pilih aplikasi teleconference.",
      path: ["teleApp"],
    },
  )
  .refine((data) => !data.teleconference || data.host !== null, {
    message: "Pilih apakah Anda sebagai host.",
    path: ["host"],
  });

export const rescheduleSchema = z
  .object({
    date: z.iso.date({ error: "Pilih tanggal." }),
    startMinute: timeField("jam mulai"),
    endMinute: timeField("jam selesai"),
  })
  .refine((data) => data.startMinute < data.endMinute, {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["endMinute"],
  });

export type RescheduleInput = z.input<typeof rescheduleSchema>;

export const reasonSchema = z
  .string()
  .trim()
  .min(3, "Isi alasan minimal 3 karakter.")
  .max(300, "Alasan maksimal 300 karakter.");

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingData = z.output<typeof bookingSchema>;
export type BookingField = keyof BookingData;

export const slotSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  date: z.iso.date(),
  startMinute: timeField("jam mulai"),
  endMinute: timeField("jam selesai"),
});

export type SlotInput = z.input<typeof slotSchema>;

export type Availability = { state: "wait" | "ok" | "bad"; message: string };
