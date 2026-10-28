"use server";

import { eq } from "drizzle-orm";
import { logActivity } from "@/backend/activity/log";
import { db } from "@/backend/db/client";
import { users } from "@/backend/db/schema";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { passwordProblem } from "@/lib/password-policy";
import {
  passwordChangeSchema,
  type PasswordChangeField,
  type PasswordChangeInput,
} from "@/lib/schemas/user";
import { hashPassword, verifyPassword } from "./password";
import { deleteUserSessions, getSessionUser } from "./session";

export async function changeOwnPasswordAction(
  input: PasswordChangeInput,
): Promise<ActionResult<PasswordChangeField>> {
  const user = await getSessionUser();
  if (!user)
    return { ok: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<PasswordChangeField>(parsed.error.issues),
    };

  const [account] = await db
    .select({
      passwordHash: users.passwordHash,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!account) return { ok: false, message: "Akun tidak ditemukan." };

  if (!(await verifyPassword(account.passwordHash, parsed.data.current))) {
    return { ok: false, fieldErrors: { current: "Password saat ini salah." } };
  }
  const weak = passwordProblem(parsed.data.password, account);
  if (weak) return { ok: false, fieldErrors: { password: weak } };

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    })
    .where(eq(users.id, user.id));
  await deleteUserSessions(user.id, true);
  await logActivity({
    action: "change_password",
    module: "auth",
    targetUserId: user.id,
    detail: user.mustChangePassword
      ? "Wajib ganti saat login pertama"
      : "Diganti sendiri, sesi di perangkat lain dikeluarkan",
  });

  return {
    ok: true,
    message:
      "Password berhasil diganti. Sesi di perangkat lain sudah dikeluarkan.",
  };
}
