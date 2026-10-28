import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import {
  accessGroupDepartments,
  accessGroups,
  departmentApprovers,
  departments,
  users,
} from "@/backend/db/schema";

export type ApproverPerson = {
  id: number;
  name: string;
  job: string;
  active: boolean;
};

async function approversByDepartment(departmentIds?: number[]) {
  const rows = await db
    .select({
      departmentId: departmentApprovers.departmentId,
      id: users.id,
      name: users.name,
      job: users.jobTitle,
      active: users.active,
    })
    .from(departmentApprovers)
    .innerJoin(users, eq(users.id, departmentApprovers.userId))
    .where(
      departmentIds
        ? inArray(departmentApprovers.departmentId, departmentIds)
        : undefined,
    )
    .orderBy(asc(users.name));

  const map = new Map<number, ApproverPerson[]>();
  for (const { departmentId, ...approver } of rows) {
    map.set(departmentId, [...(map.get(departmentId) ?? []), approver]);
  }
  return map;
}

export async function listApproverPeople() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      job: users.jobTitle,
      active: users.active,
      departmentId: departments.id,
      departmentCode: departments.code,
      departmentName: departments.name,
    })
    .from(departmentApprovers)
    .innerJoin(users, eq(users.id, departmentApprovers.userId))
    .innerJoin(departments, eq(departments.id, departmentApprovers.departmentId))
    .orderBy(asc(users.name), asc(departments.name));

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
    person.items.push({
      id: row.departmentId,
      label: `${row.departmentName} (${row.departmentCode})`,
    });
    people.set(row.id, person);
  }
  return [...people.values()];
}

export async function getApproverPerson(userId: number) {
  const rows = await db
    .select({ departmentId: departmentApprovers.departmentId, name: users.name })
    .from(departmentApprovers)
    .innerJoin(users, eq(users.id, departmentApprovers.userId))
    .where(eq(departmentApprovers.userId, userId));
  return rows.length
    ? {
        userId,
        name: rows[0].name,
        targetIds: rows.map((row) => row.departmentId),
      }
    : null;
}

export async function countDepartmentsWithoutApprover() {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(departments)
    .where(
      sql`not exists (select 1 from department_approvers dl where dl.department_id = ${departments.id})`,
    );
  return row?.total ?? 0;
}

export async function listDepartments() {
  return db
    .select({
      id: departments.id,
      code: departments.code,
      name: departments.name,
      active: departments.active,
      userCount: sql<number>`(select count(*)::int from users u where u.department_id = ${departments.id})`,
      inUse: sql<boolean>`exists (select 1 from users u where u.department_id = ${departments.id})
        or exists (select 1 from rooms r where r.department_id = ${departments.id})
        or exists (select 1 from bookings b where b.department_id = ${departments.id})`,
    })
    .from(departments)
    .orderBy(asc(departments.name));
}

export type DepartmentRow = Awaited<ReturnType<typeof listDepartments>>[number];

export async function getDepartment(id: number) {
  const [row] = await db
    .select({ id: departments.id, code: departments.code, name: departments.name, active: departments.active })
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  return row ?? null;
}

export type DepartmentDetail = NonNullable<Awaited<ReturnType<typeof getDepartment>>>;

export async function listDepartmentOptions() {
  return db
    .select({
      id: departments.id,
      code: departments.code,
      name: departments.name,
    })
    .from(departments)
    .where(eq(departments.active, true))
    .orderBy(asc(departments.name));
}

export function toDepartmentOptions(
  rows: Array<{ id: number; code: string; name: string }>,
) {
  return rows.map((row) => ({
    value: String(row.id),
    label: `${row.name} (${row.code})`,
  }));
}

export async function bookableDepartmentIds(userId: number) {
  const [user] = await db
    .select({
      departmentId: users.departmentId,
      accessGroupId: users.accessGroupId,
      locked: accessGroups.locked,
    })
    .from(users)
    .innerJoin(accessGroups, eq(accessGroups.id, users.accessGroupId))
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return [];
  if (user.locked) {
    const all = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.active, true));
    return all.map((row) => row.id);
  }
  const granted = await db
    .select({ id: accessGroupDepartments.departmentId })
    .from(accessGroupDepartments)
    .where(eq(accessGroupDepartments.accessGroupId, user.accessGroupId));
  return [...new Set([user.departmentId, ...granted.map((row) => row.id)])];
}

export async function listBookableDepartments(userId: number) {
  const ids = await bookableDepartmentIds(userId);
  if (!ids.length) return [];
  const rows = await db
    .select({
      id: departments.id,
      code: departments.code,
      name: departments.name,
    })
    .from(departments)
    .where(inArray(departments.id, ids))
    .orderBy(asc(departments.name));
  const approvers = await approversByDepartment(ids);
  return rows.map((row) => ({
    ...row,
    approvers: (approvers.get(row.id) ?? [])
      .filter((approver) => approver.active)
      .map(({ id, name, job }) => ({ id, name, job })),
  }));
}

export type BookableDepartment = Awaited<
  ReturnType<typeof listBookableDepartments>
>[number];
