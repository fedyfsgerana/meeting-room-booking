import "server-only";
import { and, asc, desc, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/client";
import {
  bookingEvents,
  bookings,
  departments,
  rooms,
  users,
} from "@/backend/db/schema";
import type { BookingEventType, BookingStatus } from "@/lib/bookings";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const requester = alias(users, "requester");
const approver = alias(users, "approver");
const actor = alias(users, "actor");

export const effectiveStatus = sql<BookingStatus>`(case when ${bookings.status} = 'draft' and ${bookings.expiresAt} <= now() then 'expired' else ${bookings.status}::text end)`;

const listFields = {
  id: bookings.id,
  topic: bookings.topic,
  date: bookings.date,
  startMinute: bookings.startMinute,
  endMinute: bookings.endMinute,
  participants: bookings.participants,
  teleconference: bookings.teleconference,
  teleApp: bookings.teleApp,
  host: bookings.host,
  counterpart: bookings.counterpart,
  status: effectiveStatus,
  expiresAt: bookings.expiresAt,
  reason: bookings.reason,
  roomId: bookings.roomId,
  roomName: rooms.name,
  roomCapacity: rooms.capacity,
  requesterId: bookings.requesterId,
  requesterName: requester.name,
  departmentId: bookings.departmentId,
  departmentCode: departments.code,
  departmentName: departments.name,
  approverId: bookings.approverId,
  rescheduledFromId: bookings.rescheduledFromId,
  approverName: approver.name,
  createdAt: bookings.createdAt,
};

export function selectBookings() {
  return db
    .select(listFields)
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .innerJoin(requester, eq(requester.id, bookings.requesterId))
    .innerJoin(departments, eq(departments.id, bookings.departmentId))
    .innerJoin(approver, eq(approver.id, bookings.approverId));
}

export async function listBookings(requesterId?: number) {
  return selectBookings()
    .where(requesterId ? eq(bookings.requesterId, requesterId) : undefined)
    .orderBy(desc(bookings.date), desc(bookings.startMinute));
}

export type BookingRow = Awaited<ReturnType<typeof listBookings>>[number];

export async function getBooking(id: number) {
  const [row] = await db
    .select({ ...listFields, notes: bookings.notes })
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .innerJoin(requester, eq(requester.id, bookings.requesterId))
    .innerJoin(departments, eq(departments.id, bookings.departmentId))
    .innerJoin(approver, eq(approver.id, bookings.approverId))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return null;

  const [next] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.rescheduledFromId, id))
    .limit(1);

  const events = await db
    .select({
      id: bookingEvents.id,
      type: bookingEvents.type,
      note: bookingEvents.note,
      actorName: actor.name,
      createdAt: bookingEvents.createdAt,
    })
    .from(bookingEvents)
    .leftJoin(actor, eq(actor.id, bookingEvents.actorId))
    .where(eq(bookingEvents.bookingId, id))
    .orderBy(asc(bookingEvents.createdAt), asc(bookingEvents.id));

  return {
    ...row,
    rescheduledToId: next?.id ?? null,
    events: events.map((event) => ({
      ...event,
      type: event.type as BookingEventType,
    })),
  };
}

export type BookingDetail = NonNullable<Awaited<ReturnType<typeof getBooking>>>;

type ConflictQuery = {
  roomId: number;
  date: string;
  startMinute: number;
  endMinute: number;
  excludeId?: number;
};

export async function findConflicts(
  tx: Tx,
  { roomId, date, startMinute, endMinute, excludeId }: ConflictQuery,
) {
  return tx
    .select({
      id: bookings.id,
      topic: bookings.topic,
      startMinute: bookings.startMinute,
      endMinute: bookings.endMinute,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.roomId, roomId),
        eq(bookings.date, date),
        lt(bookings.startMinute, endMinute),
        gt(bookings.endMinute, startMinute),
        inArray(bookings.status, ["draft", "pic", "approved"]),
        or(ne(bookings.status, "draft"), gt(bookings.expiresAt, sql`now()`)),
        excludeId ? ne(bookings.id, excludeId) : undefined,
      ),
    )
    .orderBy(asc(bookings.startMinute));
}
