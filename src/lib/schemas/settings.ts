import { z } from "zod";
import { DRAFT_TIMEOUT_OPTIONS, timeToMinutes } from "@/lib/settings";

const minuteOption = (options: readonly number[], message: string) =>
  z.coerce.number().refine((value) => options.includes(value), message);

const timeField = (label: string) =>
  z
    .string()
    .transform((value) => timeToMinutes(value))
    .refine(
      (value) => !Number.isNaN(value),
      `Isi ${label} dengan format JJ:MM.`,
    );

export const settingsSchema = z
  .object({
    draftTimeoutMinutes: minuteOption(
      DRAFT_TIMEOUT_OPTIONS,
      "Pilih batas waktu Draft.",
    ),
    operationalDays: z
      .array(z.coerce.number().int().min(0).max(6))
      .min(1, "Pilih minimal satu hari operasional.")
      .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
    openMinute: timeField("jam buka"),
    closeMinute: timeField("jam tutup"),
  })
  .refine((data) => data.openMinute < data.closeMinute, {
    message: "Jam tutup harus setelah jam buka.",
    path: ["closeMinute"],
  });

export type SettingsInput = z.input<typeof settingsSchema>;
export type SettingsField = keyof z.output<typeof settingsSchema>;

export const holidaySchema = z.object({
  date: z.iso.date({ error: "Pilih tanggal." }),
  name: z.string().trim().min(3, "Keterangan minimal 3 karakter.").max(100, "Keterangan maksimal 100 karakter."),
});

export type HolidayInput = z.input<typeof holidaySchema>;
export type HolidayField = keyof z.output<typeof holidaySchema>;
