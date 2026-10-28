import { z } from "zod";
import { ROOM_FACILITY_KEYS, ROOM_STATUSES } from "@/lib/rooms";

export const roomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Isi nama ruang.")
    .max(80, "Nama ruang maksimal 80 karakter."),
  location: z
    .string()
    .trim()
    .min(1, "Isi lokasi ruang.")
    .max(120, "Lokasi maksimal 120 karakter."),
  departmentId: z.coerce
    .number({ error: "Pilih departemen." })
    .int()
    .positive("Pilih departemen pemilik ruang."),
  capacity: z.coerce
    .number({ error: "Isi kapasitas dengan angka." })
    .int("Kapasitas harus bilangan bulat.")
    .min(1, "Kapasitas minimal 1 orang.")
    .max(500, "Kapasitas maksimal 500 orang."),
  status: z.enum(ROOM_STATUSES, { error: "Pilih status ruang." }),
  facilities: z.array(z.enum(ROOM_FACILITY_KEYS)).default([]),
});

export type RoomInput = z.input<typeof roomSchema>;

export type RoomField = keyof z.output<typeof roomSchema>;
