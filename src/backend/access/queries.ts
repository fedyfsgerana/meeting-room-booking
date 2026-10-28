import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import {
  accessGroupDepartments,
  accessGroups,
  users,
} from "@/backend/db/schema";
import type { Permission } from "@/lib/permissions";

export async function listAccessGroupOptions() {
  return db
    .select({
      id: accessGroups.id,
      code: accessGroups.code,
      name: accessGroups.name,
    })
    .from(accessGroups)
    .orderBy(asc(accessGroups.id));
}

export async function listAccessGroups() {
  const rows = await db
    .select({
      id: accessGroups.id,
      code: accessGroups.code,
      name: accessGroups.name,
      description: accessGroups.description,
      permissions: accessGroups.permissions,
      locked: accessGroups.locked,
      userCount: sql<number>`count(${users.id})::int`,
    })
    .from(accessGroups)
    .leftJoin(
      users,
      and(eq(users.accessGroupId, accessGroups.id), eq(users.active, true)),
    )
    .groupBy(accessGroups.id)
    .orderBy(asc(accessGroups.id));
  return rows.map((row) => ({
    ...row,
    permissions: row.permissions as Permission[],
  }));
}

export type AccessGroupRow = Awaited<
  ReturnType<typeof listAccessGroups>
>[number];

export async function getAccessGroup(id: number) {
  const [row] = await db
    .select({
      id: accessGroups.id,
      code: accessGroups.code,
      name: accessGroups.name,
      description: accessGroups.description,
      permissions: accessGroups.permissions,
      locked: accessGroups.locked,
    })
    .from(accessGroups)
    .where(eq(accessGroups.id, id))
    .limit(1);
  if (!row) return null;
  const departmentRows = await db
    .select({ id: accessGroupDepartments.departmentId })
    .from(accessGroupDepartments)
    .where(eq(accessGroupDepartments.accessGroupId, id));
  return {
    ...row,
    permissions: row.permissions as Permission[],
    departmentIds: departmentRows.map((item) => item.id),
  };
}

export type AccessGroupDetail = NonNullable<
  Awaited<ReturnType<typeof getAccessGroup>>
>;
