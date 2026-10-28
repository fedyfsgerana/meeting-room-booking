"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { bookingLabel } from "@/backend/activity/snapshots";
import { getSessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import { bookingEvents, bookings } from "@/backend/db/schema";
import { bookableDepartmentIds } from "@/backend/departments/queries";
import { getSettings } from "@/backend/settings/queries";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { ACTIVE_STATUSES, type BookingStatus } from "@/lib/bookings";
import { formatLongDate } from "@/lib/format";
import { formatClock } from "@/lib/time";
import {
  bookingSchema,
  reasonSchema,
  rescheduleSchema,
  slotSchema,
  type Availability,
  type BookingData,
  type BookingField,
  type BookingInput,
  type RescheduleInput,
  type SlotInput,
} from "@/lib/schemas/booking";
import {
  notifyApprovers,
  resolveNotifications,
} from "@/backend/notifications/service";
import { checkSlot, validateBooking } from "./rules";
import { takeRateLimit } from "@/backend/security/rate-limit";
import { INVALID_REQUEST, isId } from "@/lib/args";

const LIST_PATH = "/booking";
const PIC_NOTE = "Dipesan langsung oleh Penanggung Jawab Ruang ini.";
const FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk booking ruang.",
};
const NOT_FOUND = {
  ok: false as const,
  message: "Booking tidak ditemukan. Muat ulang halaman.",
};

function draftExpiry(timeoutMinutes: number, startsAt: Date) {
  return new Date(
    Math.min(Date.now() + timeoutMinutes * 60_000, startsAt.getTime()),
  );
}

async function loadOwnedBooking(id: number) {
  const [row] = await db
    .select({
      requesterId: bookings.requesterId,
      status: bookings.status,
      expiresAt: bookings.expiresAt,
      topic: bookings.topic,
      departmentId: bookings.departmentId,
      approverId: bookings.approverId,
    })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return null;
  const expired =
    row.status === "draft" &&
    row.expiresAt !== null &&
    row.expiresAt.getTime() <= Date.now();
  return {
    ...row,
    status: (expired ? "expired" : row.status) as BookingStatus,
  };
}

function withTeleconference(data: BookingData) {
  if (data.teleconference) return data;
  return { ...data, teleApp: null, host: null, counterpart: null };
}

async function canBookFor(userId: number, departmentId: number) {
  return (await bookableDepartmentIds(userId)).includes(departmentId);
}

export async function createBookingAction(
  input: BookingInput,
): Promise<ActionResult<BookingField>> {
  const user = await getSessionUser();
  if (!user?.permissions.includes("booking.create")) return FORBIDDEN;

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<BookingField>(parsed.error.issues),
    };
  const data = withTeleconference(parsed.data);
  if (!(await canBookFor(user.id, data.departmentId))) {
    return {
      ok: false,
      fieldErrors: {
        departmentId: "Anda tidak bisa memesan atas nama departemen ini.",
      },
    };
  }
  const settings = await getSettings();

  const result = await db.transaction(
    async (tx): Promise<ActionResult<BookingField>> => {
      await tx.execute(sql`select pg_advisory_xact_lock(${data.roomId})`);
      const check = await validateBooking(tx, data, settings);
      if (!check.ok) return check.result;

      const byPic = check.picUserId === user.id;
      const [row] = await tx
        .insert(bookings)
        .values({
          ...data,
          requesterId: user.id,
          approverId: check.approverId,
          status: byPic ? "approved" : "draft",
          expiresAt: byPic
            ? null
            : draftExpiry(settings.draftTimeoutMinutes, check.startsAt),
        })
        .returning({ id: bookings.id });
      await tx
        .insert(bookingEvents)
        .values({ bookingId: row.id, type: "submitted", actorId: user.id });
      if (byPic) {
        await tx
          .insert(bookingEvents)
          .values({
            bookingId: row.id,
            type: "checked_room",
            actorId: user.id,
            note: PIC_NOTE,
          });
        return {
          ok: true,
          id: row.id,
          message:
            "Booking langsung disetujui karena Anda Penanggung Jawab Ruang ini.",
        };
      }
      return {
        ok: true,
        id: row.id,
        message: "Booking diajukan dan menunggu persetujuan penyetuju.",
      };
    },
  );

  if (result.ok && result.id) {
    revalidatePath(LIST_PATH);
    if (!result.message?.startsWith("Booking langsung"))
      await notifyApprovers(result.id, "submitted");
    await logActivity({
      action: "submit",
      module: "bookings",
      targetId: result.id,
      targetLabel: await bookingLabel(result.id),
    });
  }
  return result;
}

export async function rescheduleBookingAction(
  id: number,
  input: RescheduleInput,
): Promise<ActionResult<BookingField>> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user?.permissions.includes("booking.update")) return FORBIDDEN;

  const [current] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  if (!current) return NOT_FOUND;
  if (current.requesterId !== user.id)
    return {
      ok: false,
      message: "Hanya pemesan yang bisa menjadwalkan ulang booking ini.",
    };
  const expired =
    current.status === "draft" &&
    current.expiresAt !== null &&
    current.expiresAt.getTime() <= Date.now();
  if (expired || !ACTIVE_STATUSES.includes(current.status as BookingStatus)) {
    return { ok: false, message: "Booking ini sudah tidak aktif." };
  }

  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<BookingField>(parsed.error.issues),
    };

  const data: BookingData = {
    roomId: current.roomId,
    date: parsed.data.date,
    startMinute: parsed.data.startMinute,
    endMinute: parsed.data.endMinute,
    topic: current.topic,
    departmentId: current.departmentId,
    approverId: current.approverId,
    participants: current.participants,
    teleconference: current.teleconference,
    teleApp: current.teleApp,
    host: current.host,
    counterpart: current.counterpart,
    notes: current.notes,
  };
  const settings = await getSettings();
  const oldSchedule = `${formatLongDate(current.date)}, ${formatClock(current.startMinute)}–${formatClock(current.endMinute)}`;
  const newSchedule = `${formatLongDate(data.date)}, ${formatClock(data.startMinute)}–${formatClock(data.endMinute)}`;

  const result = await db.transaction(
    async (tx): Promise<ActionResult<BookingField>> => {
      await tx.execute(sql`select pg_advisory_xact_lock(${data.roomId})`);
      const check = await validateBooking(tx, data, settings, id);
      if (!check.ok) return check.result;

      const byPic = check.picUserId === user.id;
      await tx
        .update(bookings)
        .set({ status: "rescheduled", expiresAt: null })
        .where(eq(bookings.id, id));
      const [row] = await tx
        .insert(bookings)
        .values({
          ...data,
          requesterId: current.requesterId,
          approverId: check.approverId,
          status: byPic ? "approved" : "draft",
          expiresAt: byPic
            ? null
            : draftExpiry(settings.draftTimeoutMinutes, check.startsAt),
          rescheduledFromId: id,
        })
        .returning({ id: bookings.id });

      await tx
        .insert(bookingEvents)
        .values([
          {
            bookingId: id,
            type: "rescheduled",
            actorId: user.id,
            note: `Dijadwalkan ulang ke ${newSchedule}.`,
          },
          {
            bookingId: row.id,
            type: "rescheduled",
            actorId: user.id,
            note: `Dari jadwal ${oldSchedule}.`,
          },
          ...(byPic
            ? [
                {
                  bookingId: row.id,
                  type: "checked_room" as const,
                  actorId: user.id,
                  note: PIC_NOTE,
                },
              ]
            : []),
        ]);

      return {
        ok: true,
        id: row.id,
        message: byPic
          ? "Jadwal baru langsung disetujui karena Anda Penanggung Jawab Ruang ini."
          : "Jadwal baru disimpan dan menunggu persetujuan penyetuju lagi.",
      };
    },
  );

  if (result.ok && result.id) {
    revalidatePath(LIST_PATH);
    await resolveNotifications([id]);
    if (!result.message?.startsWith("Jadwal baru langsung"))
      await notifyApprovers(result.id, "rescheduled");
    await logActivity({
      action: "reschedule",
      module: "bookings",
      targetId: result.id,
      targetLabel: await bookingLabel(result.id),
      detail: `Dari booking #${id}`,
    });
  }
  return result;
}

export async function cancelBookingAction(
  id: number,
  reason: string,
): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user) return FORBIDDEN;

  const current = await loadOwnedBooking(id);
  if (!current) return NOT_FOUND;
  const allowed =
    (current.requesterId === user.id &&
      user.permissions.includes("booking.delete")) ||
    user.permissions.includes("booking.manage");
  if (!allowed)
    return { ok: false, message: "Anda tidak bisa membatalkan booking ini." };
  if (!ACTIVE_STATUSES.includes(current.status))
    return { ok: false, message: "Booking ini sudah tidak aktif." };

  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: { reason: parsed.error.issues[0]?.message },
    };

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: "cancelled", reason: parsed.data })
      .where(eq(bookings.id, id));
    await tx
      .insert(bookingEvents)
      .values({
        bookingId: id,
        type: "cancelled",
        actorId: user.id,
        note: parsed.data,
      });
  });

  revalidatePath(LIST_PATH);
  await resolveNotifications([id]);
  await logActivity({
    action: "cancel",
    module: "bookings",
    targetId: id,
    targetLabel: await bookingLabel(id),
    detail: parsed.data,
  });
  return { ok: true, message: "Booking dibatalkan. Ruang kembali tersedia." };
}

export async function checkAvailabilityAction(
  input: SlotInput,
  excludeId?: number,
): Promise<Availability> {
  if (excludeId !== undefined && !isId(excludeId))
    return { state: "bad", message: INVALID_REQUEST.message };
  const user = await getSessionUser();
  if (
    !user ||
    !(
      user.permissions.includes("booking.create") ||
      user.permissions.includes("booking.update")
    )
  ) {
    return { state: "bad", message: FORBIDDEN.message };
  }
  if (!takeRateLimit("availability", user.id).allowed) {
    return {
      state: "bad",
      message:
        "Terlalu sering memeriksa ketersediaan. Tunggu sebentar, lalu coba lagi.",
    };
  }

  const parsed = slotSchema.safeParse(input);
  if (!parsed.success)
    return {
      state: "wait",
      message: "Pilih ruang, tanggal, dan jam untuk mengecek ketersediaan.",
    };

  const settings = await getSettings();
  const outcome = await db.transaction((tx) =>
    checkSlot(tx, parsed.data, settings, excludeId),
  );
  return outcome.ok
    ? { state: "ok", message: `${outcome.roomName} tersedia pada jam ini.` }
    : { state: "bad", message: outcome.message };
}
