import "server-only";
import { and, eq } from "drizzle-orm";
import {
  accessGroups,
  departmentApprovers,
  rooms,
  users,
} from "@/backend/db/schema";
import { closedReason } from "@/backend/settings/queries";
import type { ActionResult } from "@/lib/action-result";
import type { BookingData, BookingField } from "@/lib/schemas/booking";
import type { AppSettings } from "@/lib/settings";
import { formatClock, toDateTime, zonedNow } from "@/lib/time";
import { findConflicts, type Tx } from "./queries";

type RuleOutcome =
  | { ok: true; approverId: number; picUserId: number | null; startsAt: Date }
  | { ok: false; result: ActionResult<BookingField> };

function fail(field: BookingField, message: string): RuleOutcome {
  return {
    ok: false,
    result: { ok: false, fieldErrors: { [field]: message } },
  };
}

type Slot = {
  roomId: number;
  date: string;
  startMinute: number;
  endMinute: number;
};

type SlotOutcome =
  | { ok: true; capacity: number; roomName: string; picUserId: number | null }
  | { ok: false; field: BookingField; message: string };

export async function checkSlot(
  tx: Tx,
  slot: Slot,
  settings: AppSettings,
  excludeId?: number,
): Promise<SlotOutcome> {
  const [room] = await tx
    .select({
      name: rooms.name,
      status: rooms.status,
      capacity: rooms.capacity,
      picUserId: rooms.picUserId,
    })
    .from(rooms)
    .where(eq(rooms.id, slot.roomId))
    .limit(1);
  if (!room)
    return { ok: false, field: "roomId", message: "Ruang tidak ditemukan." };
  if (room.status !== "active")
    return {
      ok: false,
      field: "roomId",
      message: `${room.name} sedang tidak bisa dipesan.`,
    };

  if (slot.endMinute <= slot.startMinute)
    return {
      ok: false,
      field: "endMinute",
      message: "Jam selesai harus setelah jam mulai.",
    };

  const closed = await closedReason(slot.date, settings);
  if (closed)
    return {
      ok: false,
      field: "date",
      message: `${closed}. Pilih tanggal lain.`,
    };

  const now = zonedNow(new Date());
  if (slot.date < now.date)
    return { ok: false, field: "date", message: "Tanggal sudah lewat." };
  if (slot.date === now.date && slot.startMinute <= now.minute) {
    return {
      ok: false,
      field: "startMinute",
      message: "Waktu mulai sudah lewat.",
    };
  }

  if (
    slot.startMinute < settings.openMinute ||
    slot.endMinute > settings.closeMinute
  ) {
    return {
      ok: false,
      field: "startMinute",
      message: `Pilih jam di dalam jam operasional ${formatClock(settings.openMinute)}–${formatClock(settings.closeMinute)}.`,
    };
  }

  const [conflict] = await findConflicts(tx, { ...slot, excludeId });
  if (conflict) {
    return {
      ok: false,
      field: "startMinute",
      message: `Ruang sudah dipakai pukul ${formatClock(conflict.startMinute)}–${formatClock(conflict.endMinute)} untuk "${conflict.topic}". Pilih jam atau ruang lain.`,
    };
  }

  return {
    ok: true,
    capacity: room.capacity,
    roomName: room.name,
    picUserId: room.picUserId,
  };
}

export async function validateBooking(
  tx: Tx,
  data: BookingData,
  settings: AppSettings,
  excludeId?: number,
): Promise<RuleOutcome> {
  const slot = await checkSlot(
    tx,
    {
      roomId: data.roomId,
      date: data.date,
      startMinute: data.startMinute,
      endMinute: data.endMinute,
    },
    settings,
    excludeId,
  );
  if (!slot.ok) return fail(slot.field, slot.message);

  if (data.participants !== null && data.participants > slot.capacity) {
    return fail(
      "participants",
      `${slot.roomName} hanya muat ${slot.capacity} orang.`,
    );
  }

  const [approver] = await tx
    .select({ active: users.active, permissions: accessGroups.permissions })
    .from(departmentApprovers)
    .innerJoin(users, eq(users.id, departmentApprovers.userId))
    .innerJoin(accessGroups, eq(accessGroups.id, users.accessGroupId))
    .where(
      and(
        eq(departmentApprovers.departmentId, data.departmentId),
        eq(departmentApprovers.userId, data.approverId),
      ),
    )
    .limit(1);
  if (
    !approver ||
    !approver.active ||
    !approver.permissions.includes("approve_dept.approve")
  ) {
    return fail("approverId", "Pilih penyetuju aktif dari departemen ini.");
  }

  return {
    ok: true,
    approverId: data.approverId,
    picUserId: slot.picUserId,
    startsAt: toDateTime(data.date, data.startMinute),
  };
}
