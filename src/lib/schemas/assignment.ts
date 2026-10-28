import { z } from "zod";

export const assignmentSchema = z
  .object({
    userId: z
      .union([z.literal(""), z.coerce.number().int().positive()])
      .optional()
      .transform((value) => (typeof value === "number" ? value : null)),
    account: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((value) => value || null),
    targetIds: z
      .array(z.coerce.number().int().positive())
      .min(1, "Pilih minimal satu.")
      .transform((ids) => [...new Set(ids)]),
  })
  .refine((data) => data.userId !== null || data.account !== null, {
    message: "Isi email akun.",
    path: ["account"],
  });

export type AssignmentInput = z.input<typeof assignmentSchema>;
export type AssignmentField = keyof z.output<typeof assignmentSchema>;
