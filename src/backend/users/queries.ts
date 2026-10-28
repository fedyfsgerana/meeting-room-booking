import "server-only";
import { and, arrayContains, asc, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { accessGroups, departments, users } from "@/backend/db/schema";
import type { Permission } from "@/lib/permissions";

export async function listUsersWithPermission(permission: Permission) {
  return db
    .select({
      id: users.id,
      name: users.name,
      job: users.jobTitle,
      departmentCode: departments.code,
    })
    .from(users)
    .innerJoin(accessGroups, eq(accessGroups.id, users.accessGroupId))
    .innerJoin(departments, eq(departments.id, users.departmentId))
    .where(
      and(
        eq(users.active, true),
        arrayContains(accessGroups.permissions, [permission]),
      ),
    )
    .orderBy(asc(sql`lower(${users.name})`));
}

export type UserOption = Awaited<
  ReturnType<typeof listUsersWithPermission>
>[number];

export async function userHasPermission(
  userId: number,
  permission: Permission,
) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(accessGroups, eq(accessGroups.id, users.accessGroupId))
    .where(
      and(
        eq(users.id, userId),
        eq(users.active, true),
        arrayContains(accessGroups.permissions, [permission]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      job: users.jobTitle,
      departmentName: departments.name,
      departmentCode: departments.code,
      accessName: accessGroups.name,
      accessCode: accessGroups.code,
      active: users.active,
      lastLoginAt: users.lastLoginAt,
      inUse: sql<boolean>`exists (select 1 from bookings where bookings.requester_id = ${users.id} or bookings.approver_id = ${users.id})`,
    })
    .from(users)
    .innerJoin(accessGroups, eq(accessGroups.id, users.accessGroupId))
    .innerJoin(departments, eq(departments.id, users.departmentId))
    .orderBy(asc(sql`lower(${users.name})`));
}

export type UserRow = Awaited<ReturnType<typeof listUsers>>[number];

export async function getUser(id: number) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      jobTitle: users.jobTitle,
      departmentId: users.departmentId,
      accessGroupId: users.accessGroupId,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export type UserDetail = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export async function emailTaken(email: string, exceptId?: number) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return Boolean(row && row.id !== exceptId);
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  return row ?? null;
}
