import { z } from "zod";
import {
  ACCESS_DESCRIPTIONS,
  ALL_PERMISSIONS,
  type Permission,
} from "@/lib/permissions";

export const accessGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Isi nama hak akses.")
    .max(60, "Nama hak akses maksimal 60 karakter."),
  description: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (ACCESS_DESCRIPTIONS as readonly string[]).includes(value),
      "Pilih deskripsi dari daftar.",
    ),
  permissions: z.array(
    z.enum(ALL_PERMISSIONS as [Permission, ...Permission[]]),
  ),
  departmentIds: z
    .array(z.coerce.number().int().positive())
    .default([])
    .transform((ids) => [...new Set(ids)]),
});

export type AccessGroupInput = z.input<typeof accessGroupSchema>;

export type AccessGroupField = keyof z.output<typeof accessGroupSchema>;
