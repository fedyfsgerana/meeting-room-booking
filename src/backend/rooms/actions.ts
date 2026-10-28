"use server";

import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { picSnapshot, roomSnapshot } from "@/backend/activity/snapshots";
import { hasPermission } from "@/backend/auth/guard";
import { db } from "@/backend/db/client";
import { bookings, rooms } from "@/backend/db/schema";
import { isForeignKeyViolation, isUniqueViolation } from "@/backend/db/errors";
import { resolveAssignee } from "@/backend/users/assignee";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import {
  assignmentSchema,
  type AssignmentField,
  type AssignmentInput,
} from "@/lib/schemas/assignment";
import { roomSchema, type RoomField, type RoomInput } from "@/lib/schemas/room";
import { roomNameTaken } from "./queries";
import { deleteReasonSchema } from "@/lib/schemas/reason";
import { INVALID_REQUEST, isBoolean, isId } from "@/lib/args";

const FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk mengelola ruangan.",
};
const NAME_TAKEN: ActionResult<RoomField> = {
  ok: false,
  fieldErrors: { name: "Nama ruang sudah dipakai." },
};

export async function createRoomAction(
  input: RoomInput,
): Promise<ActionResult<RoomField>> {
  if (!(await hasPermission("rooms.create"))) return FORBIDDEN;

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<RoomField>(parsed.error.issues),
    };
  if (await roomNameTaken(parsed.data.name)) return NAME_TAKEN;

  try {
    const [room] = await db
      .insert(rooms)
      .values(parsed.data)
      .returning({ id: rooms.id });
    await logActivity({
      action: "create",
      module: "rooms",
      targetId: room.id,
      targetLabel: parsed.data.name,
      after: await roomSnapshot(room.id),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return NAME_TAKEN;
    throw error;
  }

  revalidatePath("/master/ruangan");
  return { ok: true, message: "Ruangan ditambahkan." };
}

export async function updateRoomAction(
  id: number,
  input: RoomInput,
): Promise<ActionResult<RoomField>> {
  if (!isId(id)) return INVALID_REQUEST;
  if (!(await hasPermission("rooms.update"))) return FORBIDDEN;

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<RoomField>(parsed.error.issues),
    };
  if (await roomNameTaken(parsed.data.name, id)) return NAME_TAKEN;

  const before = await roomSnapshot(id);
  try {
    const updated = await db
      .update(rooms)
      .set(parsed.data)
      .where(eq(rooms.id, id))
      .returning({ id: rooms.id });
    if (!updated.length)
      return {
        ok: false,
        message: "Ruangan tidak ditemukan. Muat ulang halaman.",
      };
    await logActivity({
      action: "update",
      module: "rooms",
      targetId: id,
      targetLabel: parsed.data.name,
      before,
      after: await roomSnapshot(id),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return NAME_TAKEN;
    throw error;
  }

  revalidatePath("/master/ruangan");
  return { ok: true, message: "Perubahan ruangan disimpan." };
}

const PIC_FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk mengatur Penanggung Jawab Ruang.",
};

export async function savePicAction(
  input: AssignmentInput,
  isNew: boolean,
): Promise<ActionResult<AssignmentField>> {
  if (!isBoolean(isNew)) return INVALID_REQUEST;
  if (!(await hasPermission(isNew ? "pic.create" : "pic.update")))
    return PIC_FORBIDDEN;

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<AssignmentField>(parsed.error.issues),
    };
  const resolved = await resolveAssignee(parsed.data, "approve_room.approve");
  if (!resolved.ok) return resolved.error;
  const { userId } = resolved;
  const { targetIds } = parsed.data;

  const existing = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.picUserId, userId))
    .limit(1);
  if (isNew && existing.length) {
    return {
      ok: false,
      fieldErrors: {
        account:
          "Akun ini sudah menjadi Penanggung Jawab Ruang. Ubah ruangnya dari daftar.",
      },
    };
  }

  const before = await picSnapshot(userId);
  await db.transaction(async (tx) => {
    await tx
      .update(rooms)
      .set({ picUserId: null })
      .where(and(eq(rooms.picUserId, userId), notInArray(rooms.id, targetIds)));
    await tx
      .update(rooms)
      .set({ picUserId: userId })
      .where(inArray(rooms.id, targetIds));
  });

  await logActivity({
    action: isNew ? "create" : "update",
    module: "pic",
    targetUserId: userId,
    detail: `${targetIds.length} ruang`,
    before: isNew ? null : before,
    after: await picSnapshot(userId),
  });
  revalidatePath("/master/penanggung-jawab-ruang");
  revalidatePath("/master/ruangan");
  return {
    ok: true,
    message: isNew
      ? "Penanggung Jawab Ruang ditambahkan."
      : "Perubahan Penanggung Jawab Ruang disimpan.",
  };
}

export async function removePicAction(
  userId: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(userId)) return INVALID_REQUEST;
  if (!(await hasPermission("pic.delete"))) return PIC_FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success)
    return {
      ok: false,
      fieldErrors: { reason: reasonCheck.error.issues[0]?.message },
    };
  const before = await picSnapshot(userId);
  const released = await db
    .update(rooms)
    .set({ picUserId: null })
    .where(eq(rooms.picUserId, userId))
    .returning({ id: rooms.id });
  if (!released.length)
    return {
      ok: false,
      message: "Penanggung Jawab Ruang tidak ditemukan. Muat ulang halaman.",
    };
  await logActivity({
    action: "delete",
    module: "pic",
    targetUserId: userId,
    detail: `${reasonCheck.data} (dilepas dari ${released.length} ruang)`,
    before,
  });
  revalidatePath("/master/penanggung-jawab-ruang");
  revalidatePath("/master/ruangan");
  return {
    ok: true,
    message: "Penanggung Jawab Ruang dilepas dari semua ruangnya.",
  };
}

const ROOM_IN_USE = {
  ok: false as const,
  message:
    "Ruangan ini sudah punya riwayat booking, jadi tidak bisa dihapus. Ubah statusnya menjadi Nonaktif.",
};

export async function deleteRoomAction(
  id: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  if (!(await hasPermission("rooms.delete"))) return FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success)
    return {
      ok: false,
      fieldErrors: { reason: reasonCheck.error.issues[0]?.message },
    };

  const [used] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.roomId, id))
    .limit(1);
  if (used) return ROOM_IN_USE;

  const before = await roomSnapshot(id);
  try {
    const deleted = await db
      .delete(rooms)
      .where(eq(rooms.id, id))
      .returning({ name: rooms.name });
    if (!deleted.length)
      return {
        ok: false,
        message: "Ruangan tidak ditemukan. Muat ulang halaman.",
      };
    await logActivity({
      action: "delete",
      module: "rooms",
      targetId: id,
      targetLabel: deleted[0].name,
      detail: reasonCheck.data,
      before,
    });
    revalidatePath("/master/ruangan");
    revalidatePath("/master/penanggung-jawab-ruang");
    return { ok: true, message: `${deleted[0].name} dihapus.` };
  } catch (error) {
    if (isForeignKeyViolation(error)) return ROOM_IN_USE;
    throw error;
  }
}
