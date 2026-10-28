import { z } from "zod";

export const departmentSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Kode minimal 2 karakter.")
    .max(10, "Kode maksimal 10 karakter.")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf, angka, atau strip."),
  name: z.string().trim().min(2, "Isi nama departemen.").max(80, "Nama maksimal 80 karakter."),
  active: z.boolean().default(true),
});

export type DepartmentInput = z.input<typeof departmentSchema>;
export type DepartmentField = keyof z.output<typeof departmentSchema>;
