import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/client";
import {
  bookings,
  departments,
  notifications,
  rooms,
  users,
} from "@/backend/db/schema";
import { formatShortDate } from "@/lib/format";
import { formatClock } from "@/lib/time";

const requester = alias(users, "requester");
const approver = alias(users, "approver");
const pic = alias(users, "pic");

type ApprovalEvent = "submitted" | "rescheduled" | "approved_dept";

async function loadBooking(id: number) {
  const [row] = await db
    .select({
      topic: bookings.topic,
      date: bookings.date,
      startMinute: bookings.startMinute,
      endMinute: bookings.endMinute,
      roomName: rooms.name,
      requesterName: requester.name,
      departmentCode: departments.code,
      approverId: approver.id,
      approverActive: approver.active,
      picId: pic.id,
      picActive: pic.active,
    })
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .innerJoin(requester, eq(requester.id, bookings.requesterId))
    .innerJoin(departments, eq(departments.id, bookings.departmentId))
    .innerJoin(approver, eq(approver.id, bookings.approverId))
    .leftJoin(pic, eq(pic.id, rooms.picUserId))
    .where(eq(bookings.id, id))
    .limit(1);
  return row ?? null;
}

export async function notifyApprovers(bookingId: number, event: ApprovalEvent) {
  try {
    const info = await loadBooking(bookingId);
    if (!info) return;
    const body = `${info.topic} · ${info.roomName}, ${formatShortDate(info.date)} ${formatClock(info.startMinute)}–${formatClock(info.endMinute)} · ${info.requesterName} (${info.departmentCode})`;

    if (event === "approved_dept") {
      if (!info.picId || !info.picActive) return;
      await db.insert(notifications).values({
        userId: info.picId,
        bookingId,
        kind: "approval_room",
        title: "Booking menunggu cek kesiapan ruang",
        body,
        href: "/persetujuan?tahap=pic",
      });
      return;
    }

    if (!info.approverActive) return;
    await db.insert(notifications).values({
      userId: info.approverId,
      bookingId,
      kind: "approval_dept",
      title:
        event === "submitted"
          ? "Booking baru menunggu persetujuan Anda"
          : "Booking dijadwalkan ulang, perlu persetujuan lagi",
      body,
      href: "/persetujuan?tahap=approver",
    });
  } catch (error) {
    console.error(
      `[notifikasi] Gagal membuat notifikasi booking ${bookingId}`,
      error,
    );
  }
}

export async function resolveNotifications(
  bookingIds: number[],
  kind?: "approval_dept" | "approval_room",
) {
  if (!bookingIds.length) return;
  try {
    await db
      .update(notifications)
      .set({ readAt: sql`now()` })
      .where(
        and(
          inArray(notifications.bookingId, bookingIds),
          isNull(notifications.readAt),
          kind ? eq(notifications.kind, kind) : undefined,
        ),
      );
  } catch (error) {
    console.error("[notifikasi] Gagal menandai notifikasi selesai", error);
  }
}
