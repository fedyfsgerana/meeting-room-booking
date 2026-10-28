import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/client";
import {
  accessGroupDepartments,
  accessGroups,
  appSettings,
  bookings,
  departmentApprovers,
  departments,
  rooms,
  users,
} from "@/backend/db/schema";

type Snapshot = Record<string, unknown>;

function plain<T extends object>(row: T | undefined): Snapshot | null {
  return row ? (JSON.parse(JSON.stringify(row)) as Snapshot) : null;
}

export async function roomSnapshot(id: number) {
  const [row] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return plain(row);
}

export async function userSnapshot(id: number) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) return null;
  const [approverOf, picOf] = await Promise.all([
    db
      .select({ id: departmentApprovers.departmentId })
      .from(departmentApprovers)
      .where(eq(departmentApprovers.userId, id)),
    db.select({ id: rooms.id }).from(rooms).where(eq(rooms.picUserId, id)),
  ]);
  return plain({
    ...row,
    approverOf: approverOf.map((item) => item.id),
    picOf: picOf.map((item) => item.id),
  });
}

export async function accessSnapshot(id: number) {
  const [row] = await db
    .select()
    .from(accessGroups)
    .where(eq(accessGroups.id, id))
    .limit(1);
  if (!row) return null;
  const departments = await db
    .select({ id: accessGroupDepartments.departmentId })
    .from(accessGroupDepartments)
    .where(eq(accessGroupDepartments.accessGroupId, id));
  return plain({ ...row, departmentIds: departments.map((item) => item.id) });
}

export async function approverSnapshot(userId: number) {
  const rows = await db
    .select({ id: departmentApprovers.departmentId })
    .from(departmentApprovers)
    .where(eq(departmentApprovers.userId, userId));
  return {
    userId,
    departmentIds: rows.map((row) => row.id).sort((a, b) => a - b),
  };
}

export async function picSnapshot(userId: number) {
  const rows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.picUserId, userId));
  return { userId, roomIds: rows.map((row) => row.id).sort((a, b) => a - b) };
}

export async function settingsSnapshot() {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);
  return plain(row);
}

export async function bookingLabel(id: number) {
  const [row] = await db
    .select({ topic: bookings.topic, room: rooms.name, date: bookings.date })
    .from(bookings)
    .innerJoin(rooms, eq(rooms.id, bookings.roomId))
    .where(eq(bookings.id, id))
    .limit(1);
  return row ? `${row.topic} · ${row.room} · ${row.date}` : `Booking #${id}`;
}

export async function departmentSnapshot(id: number) {
  const [row] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return plain(row);
}
