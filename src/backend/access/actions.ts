"use server";

import { and, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { accessSnapshot } from "@/backend/activity/snapshots";
import { getSessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import { isForeignKeyViolation, isUniqueViolation } from "@/backend/db/errors";
import {
  accessGroupDepartments,
  accessGroups,
  users,
} from "@/backend/db/schema";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import {
  accessGroupSchema,
  type AccessGroupField,
  type AccessGroupInput,
} from "@/lib/schemas/access";
import { deleteReasonSchema } from "@/lib/schemas/reason";
import { INVALID_REQUEST, isId } from "@/lib/args";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function saveDepartments(
  tx: Tx,
  accessGroupId: number,
  departmentIds: number[],
) {
  await tx
    .delete(accessGroupDepartments)
    .where(eq(accessGroupDepartments.accessGroupId, accessGroupId));
  if (departmentIds.length) {
    await tx
      .insert(accessGroupDepartments)
      .values(
        departmentIds.map((departmentId) => ({ accessGroupId, departmentId })),
      );
  }
}

export async function updateAccessGroupAction(
  id: number,
  input: AccessGroupInput,
): Promise<ActionResult<AccessGroupField>> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user?.permissions.includes("access.update")) {
    return {
      ok: false,
      message: "Anda tidak punya akses untuk mengatur hak akses.",
    };
  }

  const parsed = accessGroupSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<AccessGroupField>(parsed.error.issues),
    };

  const [group] = await db
    .select({ code: accessGroups.code, locked: accessGroups.locked })
    .from(accessGroups)
    .where(eq(accessGroups.id, id))
    .limit(1);
  if (!group)
    return {
      ok: false,
      message: "Hak akses tidak ditemukan. Muat ulang halaman.",
    };
  if (group.locked)
    return {
      ok: false,
      message:
        "Hak akses ini terkunci dan selalu memegang semua menu dan aksi.",
    };

  const permissions = ALL_PERMISSIONS.filter((permission) =>
    parsed.data.permissions.includes(permission),
  );
  if (
    group.code === user.accessCode &&
    !(
      permissions.includes("access.view") &&
      permissions.includes("access.update")
    )
  ) {
    return {
      ok: false,
      fieldErrors: {
        permissions:
          "Hak akses: Lihat dan Ubah tidak bisa dicabut dari hak akses Anda sendiri, supaya Anda tidak terkunci.",
      },
    };
  }

  const before = await accessSnapshot(id);
  await db.transaction(async (tx) => {
    await tx
      .update(accessGroups)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        permissions,
      })
      .where(eq(accessGroups.id, id));
    await saveDepartments(tx, id, parsed.data.departmentIds);
  });

  await logActivity({
    action: "update",
    module: "access",
    targetId: id,
    targetLabel: parsed.data.name,
    detail: `${permissions.length} aksi`,
    before,
    after: await accessSnapshot(id),
  });
  revalidatePath("/master/hak-akses");
  revalidatePath("/master/pengguna");
  return { ok: true, message: "Hak akses disimpan." };
}

const FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk mengatur hak akses.",
};

function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "grup"
  );
}

async function uniqueCode(name: string) {
  const base = slugify(name);
  const taken = await db
    .select({ code: accessGroups.code })
    .from(accessGroups)
    .where(
      or(eq(accessGroups.code, base), like(accessGroups.code, `${base}-%`)),
    );
  const codes = new Set(taken.map((row) => row.code));
  if (!codes.has(base)) return base;
  let index = 2;
  while (codes.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export async function createAccessGroupAction(
  input: AccessGroupInput,
): Promise<ActionResult<AccessGroupField>> {
  const user = await getSessionUser();
  if (!user?.permissions.includes("access.create")) return FORBIDDEN;

  const parsed = accessGroupSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<AccessGroupField>(parsed.error.issues),
    };

  const permissions = ALL_PERMISSIONS.filter((permission) =>
    parsed.data.permissions.includes(permission),
  );
  try {
    const code = await uniqueCode(parsed.data.name);
    const createdId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(accessGroups)
        .values({
          code,
          name: parsed.data.name,
          description: parsed.data.description,
          permissions,
          locked: false,
        })
        .returning({ id: accessGroups.id });
      await saveDepartments(tx, row.id, parsed.data.departmentIds);
      return row.id;
    });
    await logActivity({
      action: "create",
      module: "access",
      targetId: createdId,
      targetLabel: parsed.data.name,
      detail: `${permissions.length} aksi`,
      after: await accessSnapshot(createdId),
    });
  } catch (error) {
    if (isUniqueViolation(error))
      return {
        ok: false,
        message:
          "Hak akses dengan nama serupa baru saja dibuat. Coba simpan lagi.",
      };
    throw error;
  }

  revalidatePath("/master/hak-akses");
  revalidatePath("/master/pengguna");
  return { ok: true, message: "Hak akses ditambahkan." };
}

const GROUP_IN_USE = {
  ok: false as const,
  message:
    "Hak akses ini masih dipakai pengguna. Pindahkan penggunanya ke hak akses lain dulu di Master → Pengguna.",
};

export async function deleteAccessGroupAction(
  id: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user?.permissions.includes("access.delete")) return FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success)
    return {
      ok: false,
      fieldErrors: { reason: reasonCheck.error.issues[0]?.message },
    };

  const [group] = await db
    .select({ name: accessGroups.name, locked: accessGroups.locked })
    .from(accessGroups)
    .where(eq(accessGroups.id, id))
    .limit(1);
  if (!group)
    return {
      ok: false,
      message: "Hak akses tidak ditemukan. Muat ulang halaman.",
    };
  if (group.locked)
    return {
      ok: false,
      message: "Hak akses ini terkunci dan tidak bisa dihapus.",
    };

  const [member] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.accessGroupId, id))
    .limit(1);
  if (member) return GROUP_IN_USE;

  const before = await accessSnapshot(id);
  try {
    await db
      .delete(accessGroups)
      .where(and(eq(accessGroups.id, id), eq(accessGroups.locked, false)));
  } catch (error) {
    if (isForeignKeyViolation(error)) return GROUP_IN_USE;
    throw error;
  }

  revalidatePath("/master/hak-akses");
  revalidatePath("/master/pengguna");
  await logActivity({
    action: "delete",
    module: "access",
    targetId: id,
    targetLabel: group.name,
    detail: reasonCheck.data,
    before,
  });
  return { ok: true, message: `${group.name} dihapus.` };
}
