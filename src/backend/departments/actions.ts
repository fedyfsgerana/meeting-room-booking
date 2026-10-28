"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { approverSnapshot } from "@/backend/activity/snapshots";
import { hasPermission } from "@/backend/auth/guard";
import { db } from "@/backend/db/client";
import { departmentApprovers } from "@/backend/db/schema";
import { resolveAssignee } from "@/backend/users/assignee";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import {
  assignmentSchema,
  type AssignmentField,
  type AssignmentInput,
} from "@/lib/schemas/assignment";
import { deleteReasonSchema } from "@/lib/schemas/reason";
import { INVALID_REQUEST, isBoolean, isId } from "@/lib/args";

const FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk mengatur penyetuju.",
};

export async function saveApproverAction(
  input: AssignmentInput,
  isNew: boolean,
): Promise<ActionResult<AssignmentField>> {
  if (!isBoolean(isNew)) return INVALID_REQUEST;
  if (!(await hasPermission(isNew ? "approvers.create" : "approvers.update")))
    return FORBIDDEN;

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<AssignmentField>(parsed.error.issues),
    };
  const resolved = await resolveAssignee(parsed.data, "approve_dept.approve");
  if (!resolved.ok) return resolved.error;
  const { userId } = resolved;
  const { targetIds } = parsed.data;

  const existing = await db
    .select({ id: departmentApprovers.departmentId })
    .from(departmentApprovers)
    .where(eq(departmentApprovers.userId, userId))
    .limit(1);
  if (isNew && existing.length) {
    return {
      ok: false,
      fieldErrors: {
        account:
          "Akun ini sudah menjadi penyetuju. Ubah departemennya dari daftar Penyetuju.",
      },
    };
  }

  const before = await approverSnapshot(userId);
  await db.transaction(async (tx) => {
    await tx
      .delete(departmentApprovers)
      .where(eq(departmentApprovers.userId, userId));
    await tx
      .insert(departmentApprovers)
      .values(targetIds.map((departmentId) => ({ departmentId, userId })));
  });

  await logActivity({
    action: isNew ? "create" : "update",
    module: "approvers",
    targetUserId: userId,
    detail: `${targetIds.length} departemen`,
    before: isNew ? null : before,
    after: await approverSnapshot(userId),
  });
  revalidatePath("/master/penyetuju");
  return {
    ok: true,
    message: isNew ? "Penyetuju ditambahkan." : "Perubahan penyetuju disimpan.",
  };
}

export async function removeApproverAction(
  userId: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(userId)) return INVALID_REQUEST;
  if (!(await hasPermission("approvers.delete"))) return FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success)
    return {
      ok: false,
      fieldErrors: { reason: reasonCheck.error.issues[0]?.message },
    };
  const before = await approverSnapshot(userId);
  const removed = await db
    .delete(departmentApprovers)
    .where(eq(departmentApprovers.userId, userId))
    .returning({ id: departmentApprovers.departmentId });
  if (!removed.length)
    return {
      ok: false,
      message: "Penyetuju tidak ditemukan. Muat ulang halaman.",
    };
  await logActivity({
    action: "delete",
    module: "approvers",
    targetUserId: userId,
    detail: `${reasonCheck.data} (dilepas dari ${removed.length} departemen)`,
    before,
  });
  revalidatePath("/master/penyetuju");
  return { ok: true, message: "Penyetuju dihapus dari semua departemennya." };
}
