"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { userSnapshot } from "@/backend/activity/snapshots";
import { hashPassword } from "@/backend/auth/password";
import { deleteUserSessions, getSessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import { isForeignKeyViolation, isUniqueViolation } from "@/backend/db/errors";
import { bookings, users } from "@/backend/db/schema";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/permissions";
import {
  passwordResetSchema,
  userCreateSchema,
  userUpdateSchema,
  type PasswordField,
  type PasswordResetInput,
  type UserCreateInput,
  type UserField,
  type UserUpdateInput,
} from "@/lib/schemas/user";
import { emailTaken } from "./queries";
import { deleteReasonSchema } from "@/lib/schemas/reason";
import { passwordProblem } from "@/lib/password-policy";
import { INVALID_REQUEST, isBoolean, isId } from "@/lib/args";

const LIST_PATH = "/master/pengguna";
const FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk mengelola pengguna.",
};
const IDENTITY_TAKEN = {
  ok: false as const,
  fieldErrors: { email: "Email sudah dipakai pengguna lain." },
};

async function identityConflict(data: { email: string }, exceptId?: number) {
  return (await emailTaken(data.email, exceptId)) ? IDENTITY_TAKEN : null;
}
const BAD_REFERENCE = {
  ok: false as const,
  message: "Departemen atau hak akses tidak ditemukan. Muat ulang halaman.",
};
const NOT_FOUND = {
  ok: false as const,
  message: "Pengguna tidak ditemukan. Muat ulang halaman.",
};

async function currentManager(permission: Permission) {
  const user = await getSessionUser();
  return user?.permissions.includes(permission) ? user : null;
}

export async function createUserAction(
  input: UserCreateInput,
): Promise<ActionResult<UserField>> {
  if (!(await currentManager("users.create"))) return FORBIDDEN;

  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<UserField>(parsed.error.issues),
    };
  const { password, ...data } = parsed.data;
  const conflict = await identityConflict(data);
  if (conflict) return conflict;
  const weak = passwordProblem(password, data);
  if (weak) return { ok: false, fieldErrors: { password: weak } };

  try {
    const [created] = await db
      .insert(users)
      .values({
        ...data,
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
      })
      .returning({ id: users.id });
    await logActivity({
      action: "create",
      module: "users",
      targetId: created.id,
      targetLabel: `${data.name} (${data.email})`,
      after: await userSnapshot(created.id),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return IDENTITY_TAKEN;
    if (isForeignKeyViolation(error)) return BAD_REFERENCE;
    throw error;
  }

  revalidatePath(LIST_PATH);
  return { ok: true, message: "Pengguna ditambahkan." };
}

export async function updateUserAction(
  id: number,
  input: UserUpdateInput,
): Promise<ActionResult<UserField>> {
  if (!isId(id)) return INVALID_REQUEST;
  const manager = await currentManager("users.update");
  if (!manager) return FORBIDDEN;

  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<UserField>(parsed.error.issues),
    };
  const data = parsed.data;
  const conflict = await identityConflict(data, id);
  if (conflict) return conflict;

  if (id === manager.id) {
    const [current] = await db
      .select({ groupId: users.accessGroupId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (current && current.groupId !== data.accessGroupId) {
      return {
        ok: false,
        fieldErrors: {
          accessGroupId: "Hak akses akun sendiri tidak bisa diubah.",
        },
      };
    }
  }

  const before = await userSnapshot(id);
  try {
    const updated = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!updated.length) return NOT_FOUND;
    await logActivity({
      action: "update",
      module: "users",
      targetId: id,
      targetLabel: `${data.name} (${data.email})`,
      before,
      after: await userSnapshot(id),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return IDENTITY_TAKEN;
    if (isForeignKeyViolation(error)) return BAD_REFERENCE;
    throw error;
  }

  revalidatePath(LIST_PATH);
  return { ok: true, message: "Perubahan pengguna disimpan." };
}

export async function setUserActiveAction(
  id: number,
  active: boolean,
): Promise<ActionResult> {
  if (!isId(id) || !isBoolean(active)) return INVALID_REQUEST;
  const manager = await currentManager("users.deactivate");
  if (!manager) return FORBIDDEN;
  if (id === manager.id && !active)
    return { ok: false, message: "Akun sendiri tidak bisa dinonaktifkan." };

  const before = await userSnapshot(id);
  const updated = await db
    .update(users)
    .set({ active })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (!updated.length) return NOT_FOUND;
  if (!active) await deleteUserSessions(id);
  await logActivity({
    action: active ? "activate" : "deactivate",
    module: "users",
    targetUserId: id,
    before,
    after: await userSnapshot(id),
  });

  revalidatePath(LIST_PATH);
  return {
    ok: true,
    message: active ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.",
  };
}

export async function resetUserPasswordAction(
  id: number,
  input: PasswordResetInput,
): Promise<ActionResult<PasswordField>> {
  if (!isId(id)) return INVALID_REQUEST;
  const manager = await currentManager("users.reset_password");
  if (!manager) return FORBIDDEN;

  const parsed = passwordResetSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<PasswordField>(parsed.error.issues),
    };

  const [target] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) return NOT_FOUND;
  const weak = passwordProblem(parsed.data.password, target);
  if (weak) return { ok: false, fieldErrors: { password: weak } };

  const updated = await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: id !== manager.id,
    })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (!updated.length) return NOT_FOUND;
  await deleteUserSessions(id, id === manager.id);
  await logActivity({
    action: "reset_password",
    module: "users",
    targetUserId: id,
  });

  revalidatePath(LIST_PATH);
  return {
    ok: true,
    message:
      id === manager.id
        ? "Password berhasil diatur ulang."
        : "Password diatur ulang. Pengguna wajib menggantinya saat login berikutnya.",
  };
}

const USER_IN_USE = {
  ok: false as const,
  message:
    "Pengguna ini sudah punya riwayat booking atau persetujuan, jadi tidak bisa dihapus. Nonaktifkan saja akunnya.",
};

export async function deleteUserAction(
  id: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  const manager = await currentManager("users.delete");
  if (!manager) return FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success)
    return {
      ok: false,
      fieldErrors: { reason: reasonCheck.error.issues[0]?.message },
    };
  if (id === manager.id)
    return { ok: false, message: "Akun sendiri tidak bisa dihapus." };

  const [used] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(or(eq(bookings.requesterId, id), eq(bookings.approverId, id)))
    .limit(1);
  if (used) return USER_IN_USE;

  const before = await userSnapshot(id);
  try {
    const deleted = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ name: users.name });
    if (!deleted.length) return NOT_FOUND;
    await logActivity({
      action: "delete",
      module: "users",
      targetId: id,
      targetLabel: deleted[0].name,
      detail: reasonCheck.data,
      before,
    });
    revalidatePath(LIST_PATH);
    revalidatePath("/master/penyetuju");
    revalidatePath("/master/penanggung-jawab-ruang");
    return { ok: true, message: `${deleted[0].name} dihapus.` };
  } catch (error) {
    if (isForeignKeyViolation(error)) return USER_IN_USE;
    throw error;
  }
}
