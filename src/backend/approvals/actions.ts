"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { bookingLabel } from "@/backend/activity/snapshots";
import { getSessionUser, type SessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import {
  notifyApprovers,
  resolveNotifications,
} from "@/backend/notifications/service";
import {
  bookingEvents,
  bookings,
  departmentApprovers,
  rooms,
} from "@/backend/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { reasonSchema } from "@/lib/schemas/booking";
import { INVALID_REQUEST, isId } from "@/lib/args";

const CHANGED = {
  ok: false as const,
  message: "Status booking sudah berubah. Muat ulang halaman.",
};

type BookingState = {
  status: string;
  expiresAt: Date | null;
  approverId: number;
  departmentId: number;
  picUserId: number | null;
  date: string;
  topic: string;
};

async function loadState(id: number): Promise<BookingState | null> {
  const [row] = await db
    .select({
      status: bookings.status,
      expiresAt: bookings.expiresAt,
      approverId: bookings.approverId,
      departmentId: bookings.departmentId,
      picUserId: rooms.picUserId,
      date: bookings.date,
      topic: bookings.topic,
    })
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .where(eq(bookings.id, id))
    .limit(1);
  return row ?? null;
}

function isAdmin(user: SessionUser) {
  return user.permissions.includes("booking.manage");
}

async function leads(userId: number, departmentId: number) {
  const [row] = await db
    .select({ id: departmentApprovers.userId })
    .from(departmentApprovers)
    .where(
      and(
        eq(departmentApprovers.userId, userId),
        eq(departmentApprovers.departmentId, departmentId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

function refresh() {
  revalidatePath("/persetujuan");
  revalidatePath("/booking");
}

async function transition(
  id: number,
  from: "draft" | "pic",
  to: "pic" | "approved" | "rejected",
  event: "approved_dept" | "checked_room" | "rejected",
  actorId: number,
  note: string | null = null,
) {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(bookings)
      .set({
        status: to,
        ...(to === "rejected" ? { reason: note } : {}),
        ...(from === "draft" ? { expiresAt: null } : {}),
      })
      .where(
        and(
          eq(bookings.id, id),
          eq(bookings.status, from),
          from === "draft" ? gt(bookings.expiresAt, sql`now()`) : undefined,
        ),
      )
      .returning({ id: bookings.id });
    if (!updated.length) return false;
    await tx
      .insert(bookingEvents)
      .values({ bookingId: id, type: event, actorId, note });
    return true;
  });
}

export async function approveDeptAction(id: number): Promise<ActionResult> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user?.permissions.includes("approve_dept.approve"))
    return {
      ok: false,
      message: "Anda tidak punya hak menyetujui sebagai penyetuju.",
    };

  const state = await loadState(id);
  if (!state) return CHANGED;
  if (!isAdmin(user) && !(await leads(user.id, state.departmentId)))
    return { ok: false, message: "Booking ini bukan untuk Anda setujui." };

  if (!(await transition(id, "draft", "pic", "approved_dept", user.id)))
    return CHANGED;
  refresh();
  await resolveNotifications([id], "approval_dept");
  await notifyApprovers(id, "approved_dept");
  await logActivity({
    action: "approve",
    module: "approvals",
    targetId: id,
    targetLabel: await bookingLabel(id),
    detail: "Penyetuju",
  });
  return {
    ok: true,
    message: "Booking disetujui dan diteruskan ke Penanggung Jawab Ruang.",
  };
}

export async function checkPicAction(id: number): Promise<ActionResult> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user?.permissions.includes("approve_room.approve"))
    return {
      ok: false,
      message: "Anda tidak punya hak menyetujui sebagai Penanggung Jawab Ruang.",
    };

  const state = await loadState(id);
  if (!state) return CHANGED;
  if (state.picUserId !== user.id && !isAdmin(user))
    return { ok: false, message: "Ruang ini bukan tanggung jawab Anda." };

  if (!(await transition(id, "pic", "approved", "checked_room", user.id)))
    return CHANGED;
  refresh();
  await resolveNotifications([id], "approval_room");
  await logActivity({
    action: "check",
    module: "approvals",
    targetId: id,
    targetLabel: await bookingLabel(id),
    detail: "Penanggung Jawab Ruang",
  });
  return { ok: true, message: "Ruang siap. Booking disetujui." };
}

export async function rejectBookingAction(
  id: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user)
    return { ok: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const state = await loadState(id);
  if (!state) return CHANGED;

  const asApprover =
    state.status === "draft" &&
    user.permissions.includes("approve_dept.reject") &&
    (isAdmin(user) || (await leads(user.id, state.departmentId)));
  const asPic =
    state.status === "pic" &&
    user.permissions.includes("approve_room.reject") &&
    (state.picUserId === user.id || isAdmin(user));
  if (!asApprover && !asPic)
    return { ok: false, message: "Anda tidak bisa menolak booking ini." };

  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: { reason: parsed.error.issues[0]?.message },
    };

  const from = state.status === "draft" ? "draft" : "pic";
  if (
    !(await transition(id, from, "rejected", "rejected", user.id, parsed.data))
  )
    return CHANGED;
  refresh();
  await resolveNotifications([id]);
  await logActivity({
    action: "reject",
    module: "approvals",
    targetId: id,
    targetLabel: await bookingLabel(id),
    detail: `${asApprover ? "Penyetuju" : "Penanggung Jawab Ruang"}: ${parsed.data}`,
  });
  return { ok: true, message: "Booking ditolak. Ruang kembali tersedia." };
}
