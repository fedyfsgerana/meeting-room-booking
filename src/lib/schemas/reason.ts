import { z } from "zod";

export const deleteReasonSchema = z
  .string()
  .trim()
  .min(3, "Isi alasan penghapusan minimal 3 karakter.")
  .max(300, "Alasan maksimal 300 karakter.");
