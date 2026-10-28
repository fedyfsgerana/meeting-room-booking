import "server-only";
import { and, asc, eq, gt, inArray, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/client";
import { bookings, departments, rooms, users } from "@/backend/db/schema";
import type { BookingStatus } from "@/lib/bookings";

const requester = alias(users, "requester");
const approver = alias(users, "approver");
const roomDepartment = alias(departments, "room_department");

export async function getDaySchedule(date: string) {
  const [roomRows, bookingRows] = await Promise.all([
    db
      .select({
        id: rooms.id,
        name: rooms.name,
        capacity: rooms.capacity,
        status: rooms.status,
        departmentCode: roomDepartment.code,
        departmentName: roomDepartment.name,
      })
      .from(rooms)
      .leftJoin(roomDepartment, eq(roomDepartment.id, rooms.departmentId))
      .orderBy(asc(sql`lower(${rooms.name})`)),
    db
      .select({
        id: bookings.id,
        roomId: bookings.roomId,
        topic: bookings.topic,
        startMinute: bookings.startMinute,
        endMinute: bookings.endMinute,
        status: bookings.status,
        requesterId: bookings.requesterId,
        requesterName: requester.name,
        participants: bookings.participants,
        departmentCode: departments.code,
        approverName: approver.name,
        teleconference: bookings.teleconference,
        teleApp: bookings.teleApp,
        host: bookings.host,
        expiresAt: bookings.expiresAt,
      })
      .from(bookings)
      .innerJoin(requester, eq(requester.id, bookings.requesterId))
      .innerJoin(departments, eq(departments.id, bookings.departmentId))
      .innerJoin(approver, eq(approver.id, bookings.approverId))
      .where(
        and(
          eq(bookings.date, date),
          inArray(bookings.status, ["draft", "pic", "approved", "done"]),
          or(ne(bookings.status, "draft"), gt(bookings.expiresAt, sql`now()`)),
        ),
      )
      .orderBy(asc(bookings.startMinute)),
  ]);

  return {
    rooms: roomRows,
    bookings: bookingRows.map((row) => ({
      ...row,
      status: row.status as BookingStatus,
    })),
  };
}

export type DaySchedule = Awaited<ReturnType<typeof getDaySchedule>>;
export type ScheduleRoom = DaySchedule["rooms"][number];
export type ScheduleBooking = DaySchedule["bookings"][number];
