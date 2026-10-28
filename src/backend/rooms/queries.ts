import "server-only";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/client";
import { departments, rooms, users } from "@/backend/db/schema";

const pic = alias(users, "pic");

export async function listRooms() {
  return db
    .select({
      id: rooms.id,
      name: rooms.name,
      location: rooms.location,
      departmentName: departments.name,
      departmentCode: departments.code,
      capacity: rooms.capacity,
      status: rooms.status,
      facilities: rooms.facilities,
      picName: pic.name,
      inUse: sql<boolean>`exists (select 1 from bookings where bookings.room_id = ${rooms.id})`,
    })
    .from(rooms)
    .leftJoin(pic, eq(pic.id, rooms.picUserId))
    .leftJoin(departments, eq(departments.id, rooms.departmentId))
    .orderBy(asc(sql`lower(${rooms.name})`));
}

export type RoomRow = Awaited<ReturnType<typeof listRooms>>[number];

export async function roomNameTaken(name: string, exceptId?: number) {
  const [row] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(sql`lower(${rooms.name}) = ${name.toLowerCase()}`)
    .limit(1);
  return Boolean(row && row.id !== exceptId);
}

export async function getRoom(id: number) {
  const [row] = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      location: rooms.location,
      departmentId: rooms.departmentId,
      capacity: rooms.capacity,
      status: rooms.status,
      facilities: rooms.facilities,
    })
    .from(rooms)
    .where(eq(rooms.id, id))
    .limit(1);
  return row ?? null;
}

export type RoomDetail = NonNullable<Awaited<ReturnType<typeof getRoom>>>;

export async function listPicPeople() {
  const rows = await db
    .select({
      id: pic.id,
      name: pic.name,
      job: pic.jobTitle,
      active: pic.active,
      roomId: rooms.id,
      roomName: rooms.name,
    })
    .from(rooms)
    .innerJoin(pic, eq(pic.id, rooms.picUserId))
    .orderBy(asc(pic.name), asc(sql`lower(${rooms.name})`));

  const people = new Map<
    number,
    {
      id: number;
      name: string;
      job: string;
      active: boolean;
      items: Array<{ id: number; label: string }>;
    }
  >();
  for (const row of rows) {
    const person = people.get(row.id) ?? {
      id: row.id,
      name: row.name,
      job: row.job,
      active: row.active,
      items: [],
    };
    person.items.push({ id: row.roomId, label: row.roomName });
    people.set(row.id, person);
  }
  return [...people.values()];
}

export async function getPicPerson(userId: number) {
  const rows = await db
    .select({ id: rooms.id, name: pic.name })
    .from(rooms)
    .innerJoin(pic, eq(pic.id, rooms.picUserId))
    .where(eq(rooms.picUserId, userId));
  return rows.length
    ? { userId, name: rows[0].name, targetIds: rows.map((row) => row.id) }
    : null;
}

export async function countRoomsWithoutPic() {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rooms)
    .where(isNull(rooms.picUserId));
  return row?.total ?? 0;
}

export async function listPicRoomOptions() {
  const rows = await db
    .select({ id: rooms.id, name: rooms.name, picName: pic.name })
    .from(rooms)
    .leftJoin(pic, eq(pic.id, rooms.picUserId))
    .orderBy(asc(sql`lower(${rooms.name})`));
  return rows.map((row) => ({
    value: String(row.id),
    label: row.picName ? `${row.name} · ${row.picName}` : row.name,
  }));
}

export async function listRoomOptions() {
  return db
    .select({ id: rooms.id, name: rooms.name, capacity: rooms.capacity })
    .from(rooms)
    .where(eq(rooms.status, "active"))
    .orderBy(asc(sql`lower(${rooms.name})`));
}
