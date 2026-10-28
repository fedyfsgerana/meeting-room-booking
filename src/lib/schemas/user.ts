import { z } from "zod";

const passwordField = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(128, "Password maksimal 128 karakter.");

const userBase = z.object({
  email: z.string().trim().toLowerCase().max(120, "Email maksimal 120 karakter.").pipe(z.email("Isi email yang valid.")),
  name: z
    .string()
    .trim()
    .min(1, "Isi nama lengkap.")
    .max(80, "Nama maksimal 80 karakter."),
  jobTitle: z
    .string()
    .trim()
    .min(1, "Isi jabatan.")
    .max(80, "Jabatan maksimal 80 karakter."),
  departmentId: z.coerce
    .number({ error: "Pilih departemen." })
    .int()
    .positive("Pilih departemen."),
  accessGroupId: z.coerce
    .number({ error: "Pilih hak akses." })
    .int()
    .positive("Pilih hak akses."),
});

export const userCreateSchema = userBase.extend({ password: passwordField });

export const userUpdateSchema = userBase;

export const passwordResetSchema = z
  .object({
    password: passwordField,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Ulangi password dengan benar.",
    path: ["confirm"],
  });

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Isi password saat ini."),
    password: passwordField,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Ulangi password dengan benar.",
    path: ["confirm"],
  })
  .refine((data) => data.password !== data.current, {
    message: "Password baru harus berbeda dari password saat ini.",
    path: ["password"],
  });

export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;
export type PasswordChangeField = "current" | "password" | "confirm";

export type UserCreateInput = z.input<typeof userCreateSchema>;
export type UserUpdateInput = z.input<typeof userUpdateSchema>;
export type PasswordResetInput = z.input<typeof passwordResetSchema>;

export type UserField = keyof z.output<typeof userCreateSchema>;
export type PasswordField = "password" | "confirm";
