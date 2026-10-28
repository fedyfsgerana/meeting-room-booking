import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Isi email."),
  password: z.string().min(1, "Isi password."),
  remember: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginState = {
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
  email?: string;
  remember?: boolean;
};
