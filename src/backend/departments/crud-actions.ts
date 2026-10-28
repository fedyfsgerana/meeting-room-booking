"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { departmentSnapshot } from "@/backend/activity/snapshots";
import { hasPermission } from "@/backend/auth/guard";
import { db } from "@/backend/db/client";
import { isForeignKeyViolation, isUniqueViolation } from "@/backend/db/errors";
import { departments, rooms } from "@/backend/db/schema";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { INVALID_REQUEST, isId } from "@/lib/args";
import { departmentSchema, type DepartmentField, type DepartmentInput } from "@/lib/schemas/department";
import { deleteReasonSchema } from "@/lib/schemas/reason";

const LIST_PATH = "/master/departemen";
const FORBIDDEN = { ok: false as const, message: "Anda tidak punya akses untuk mengelola departemen." };
const CODE_TAKEN: ActionResult<DepartmentField> = { ok: false, fieldErrors: { code: "Kode departemen sudah dipakai." } };

function refresh() {
  revalidatePath(LIST_PATH);
  revalidatePath("/master/pengguna");
  revalidatePath("/master/ruangan");
}

export async function createDepartmentAction(input: DepartmentInput): Promise<ActionResult<DepartmentField>> {
  if (!(await hasPermission("departments.create"))) return FORBIDDEN;
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom<DepartmentField>(parsed.error.issues) };

  try {
    const [row] = await db.insert(departments).values(parsed.data).returning({ id: departments.id });
    await logActivity({
      action: "create",
      module: "departments",
      targetId: row.id,
      targetLabel: `${parsed.data.name} (${parsed.data.code})`,
      after: await departmentSnapshot(row.id),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return CODE_TAKEN;
    throw error;
  }

  refresh();
  return { ok: true, message: "Departemen ditambahkan." };
}

export async function updateDepartmentAction(id: number, input: DepartmentInput): Promise<ActionResult<DepartmentField>> {
  if (!isId(id)) return INVALID_REQUEST;
  if (!(await hasPermission("departments.update"))) return FORBIDDEN;
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom<DepartmentField>(parsed.error.issues) };

  const before = await departmentSnapshot(id);
  if (!before) return { ok: false, message: "Departemen tidak ditemukan. Muat ulang halaman." };

  try {
    await db.update(departments).set(parsed.data).where(eq(departments.id, id));
    await logActivity({
      action: "update",
      module: "departments",
      targetId: id,
      targetLabel: `${parsed.data.name} (${parsed.data.code})`,
      before,
      after: await departmentSnapshot(id),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return CODE_TAKEN;
    throw error;
  }

  refresh();
  return { ok: true, message: "Perubahan departemen disimpan." };
}

export async function deleteDepartmentAction(id: number, reason: string): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  if (!(await hasPermission("departments.delete"))) return FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success) return { ok: false, fieldErrors: { reason: reasonCheck.error.issues[0]?.message } };

  const before = await departmentSnapshot(id);
  if (!before) return { ok: false, message: "Departemen tidak ditemukan. Muat ulang halaman." };

  const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.departmentId, id)).limit(1);
  if (room) return { ok: false, message: "Departemen ini masih dipakai ruangan. Nonaktifkan saja." };

  try {
    await db.delete(departments).where(eq(departments.id, id));
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { ok: false, message: "Departemen ini masih dipakai pengguna, ruangan, atau booking. Nonaktifkan saja." };
    }
    throw error;
  }

  await logActivity({
    action: "delete",
    module: "departments",
    targetId: id,
    targetLabel: `${String(before.name)} (${String(before.code)})`,
    detail: reasonCheck.data,
    before,
  });
  refresh();
  return { ok: true, message: "Departemen dihapus." };
}
