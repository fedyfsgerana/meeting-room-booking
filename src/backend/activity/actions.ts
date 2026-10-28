"use server";

import { and, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import {
  accessGroupDepartments,
  accessGroups,
  activityLogs,
  appSettings,
  departmentApprovers,
  departments,
  rooms,
  users,
} from "@/backend/db/schema";
import type { ActionResult } from "@/lib/action-result";
import {
  ACTIVITY_ACTION_LABEL,
  RESTORABLE_MODULES,
  type ActivityModule,
} from "@/lib/activity";
import { formatDateTime } from "@/lib/format";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { ROOM_STATUSES } from "@/lib/rooms";
import { getActivityDetail, type ActivityDetail } from "./detail";
import { logActivity } from "./log";
import {
  accessSnapshot,
  departmentSnapshot,
  picSnapshot,
  approverSnapshot,
  roomSnapshot,
  settingsSnapshot,
  userSnapshot,
} from "./snapshots";
import { takeRateLimit } from "@/backend/security/rate-limit";
import { INVALID_REQUEST, isId } from "@/lib/args";

type Snapshot = Record<string, unknown>;
type Outcome =
  | { ok: true; label: string; before: Snapshot | null; after: Snapshot | null }
  | { ok: false; message: string };

const PATHS: Record<string, string[]> = {
  rooms: ["/master/ruangan", "/master/penanggung-jawab-ruang"],
  users: [
    "/master/pengguna",
    "/master/penyetuju",
    "/master/penanggung-jawab-ruang",
  ],
  access: ["/master/hak-akses", "/master/pengguna"],
  departments: ["/master/departemen", "/master/pengguna", "/master/ruangan"],
  approvers: ["/master/penyetuju"],
  pic: ["/master/penanggung-jawab-ruang", "/master/ruangan"],
  settings: ["/pengaturan/aturan-booking"],
};

function textArray(items: string[]) {
  return items.length
    ? sql`array[${sql.join(
        items.map((item) => sql`${item}`),
        sql`, `,
      )}]::text[]`
    : sql`'{}'::text[]`;
}

const text = (value: unknown) => (typeof value === "string" ? value : null);
const num = (value: unknown) => (typeof value === "number" ? value : null);
const ids = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number")
    : [];

async function existingDepartments(list: number[]) {
  if (!list.length) return [];
  const rows = await db
    .select({ id: departments.id })
    .from(departments)
    .where(inArray(departments.id, list));
  return rows.map((row) => row.id);
}

async function existingRooms(list: number[]) {
  if (!list.length) return [];
  const rows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(inArray(rooms.id, list));
  return rows.map((row) => row.id);
}

async function departmentExists(id: number | null) {
  if (id === null) return false;
  return (await existingDepartments([id])).length > 0;
}

async function userExists(id: number | null) {
  if (id === null) return false;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return Boolean(row);
}

async function restoreRoom(snapshot: Snapshot): Promise<Outcome> {
  const id = num(snapshot.id);
  const name = text(snapshot.name);
  if (id === null || !name)
    return { ok: false, message: "Salinan data ruangan tidak lengkap." };

  const [taken] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(
      and(sql`lower(${rooms.name}) = ${name.toLowerCase()}`, ne(rooms.id, id)),
    )
    .limit(1);
  if (taken)
    return {
      ok: false,
      message: `Nama ruangan "${name}" sudah dipakai ruangan lain. Ganti nama ruangan itu dulu.`,
    };

  const departmentId = num(snapshot.departmentId);
  const picUserId = num(snapshot.picUserId);
  const status = ROOM_STATUSES.includes(
    snapshot.status as (typeof ROOM_STATUSES)[number],
  )
    ? (snapshot.status as (typeof ROOM_STATUSES)[number])
    : "active";
  const values = {
    name,
    location: text(snapshot.location) ?? "",
    capacity: num(snapshot.capacity) ?? 1,
    departmentId: (await departmentExists(departmentId)) ? departmentId : null,
    status,
    facilities: Array.isArray(snapshot.facilities)
      ? (snapshot.facilities as string[])
      : [],
    picUserId: (await userExists(picUserId)) ? picUserId : null,
  };

  const before = await roomSnapshot(id);
  if (before) {
    await db.update(rooms).set(values).where(eq(rooms.id, id));
  } else {
    await db.execute(sql`
      insert into rooms (id, name, location, capacity, department_id, status, facilities, pic_user_id)
      overriding system value
      values (${id}, ${values.name}, ${values.location}, ${values.capacity}, ${values.departmentId}, ${values.status},
              ${textArray(values.facilities)}, ${values.picUserId})
    `);
  }
  return { ok: true, label: name, before, after: await roomSnapshot(id) };
}

async function restoreUser(snapshot: Snapshot): Promise<Outcome> {
  const id = num(snapshot.id);
  const email = text(snapshot.email);
  const name = text(snapshot.name);
  const passwordHash = text(snapshot.passwordHash);
  if (id === null || !email || !name || !passwordHash)
    return { ok: false, message: "Salinan data pengguna tidak lengkap." };

  const [conflict] = await db
    .select({ name: users.name })
    .from(users)
    .where(
      and(
        ne(users.id, id),
        sql`lower(${users.email}) = ${email.toLowerCase()}`,
      ),
    )
    .limit(1);
  if (conflict)
    return {
      ok: false,
      message: `Email-nya sudah dipakai akun ${conflict.name}.`,
    };

  const departmentId = num(snapshot.departmentId);
  const accessGroupId = num(snapshot.accessGroupId);
  if (!(await departmentExists(departmentId)))
    return { ok: false, message: "Departemen pengguna ini sudah tidak ada." };
  const [group] = accessGroupId
    ? await db
        .select({ id: accessGroups.id })
        .from(accessGroups)
        .where(eq(accessGroups.id, accessGroupId))
        .limit(1)
    : [];
  if (!group)
    return {
      ok: false,
      message:
        "Hak akses pengguna ini sudah dihapus. Kembalikan hak aksesnya dulu.",
    };

  const values = {
    email,
    name,
    jobTitle: text(snapshot.jobTitle) ?? "",
    departmentId: departmentId as number,
    accessGroupId: group.id,
    mustChangePassword: snapshot.mustChangePassword === true,
    active: snapshot.active !== false,
  };

  const before = await userSnapshot(id);
  if (before) {
    await db.update(users).set(values).where(eq(users.id, id));
  } else {
    await db.execute(sql`
      insert into users (id, email, name, job_title, department_id, access_group_id,
                         password_hash, must_change_password, active)
      overriding system value
      values (${id}, ${values.email}, ${values.name}, ${values.jobTitle},
              ${values.departmentId}, ${values.accessGroupId}, ${passwordHash}, ${values.mustChangePassword}, ${values.active})
    `);
    const approverOf = await existingDepartments(ids(snapshot.approverOf));
    if (approverOf.length) {
      await db
        .insert(departmentApprovers)
        .values(approverOf.map((departmentId) => ({ departmentId, userId: id })))
        .onConflictDoNothing();
    }
    const picOf = await existingRooms(ids(snapshot.picOf));
    if (picOf.length) {
      await db
        .update(rooms)
        .set({ picUserId: id })
        .where(and(inArray(rooms.id, picOf), sql`${rooms.picUserId} is null`));
    }
  }
  return {
    ok: true,
    label: `${name} (${email})`,
    before,
    after: await userSnapshot(id),
  };
}

async function restoreAccess(snapshot: Snapshot): Promise<Outcome> {
  const id = num(snapshot.id);
  const name = text(snapshot.name);
  if (id === null || !name)
    return { ok: false, message: "Salinan data hak akses tidak lengkap." };

  const permissions = ALL_PERMISSIONS.filter((permission) =>
    (snapshot.permissions as unknown[] | undefined)?.includes(permission),
  );
  const description = text(snapshot.description) ?? "";
  const departmentIds = await existingDepartments(ids(snapshot.departmentIds));

  const before = await accessSnapshot(id);
  if (before?.locked)
    return {
      ok: false,
      message:
        "Hak akses Administrator terkunci dan tidak bisa dikembalikan ke versi lain.",
    };

  await db.transaction(async (tx) => {
    if (before) {
      await tx
        .update(accessGroups)
        .set({ name, description, permissions })
        .where(eq(accessGroups.id, id));
    } else {
      const base = text(snapshot.code) ?? `akses-${id}`;
      const [codeTaken] = await tx
        .select({ id: accessGroups.id })
        .from(accessGroups)
        .where(eq(accessGroups.code, base))
        .limit(1);
      const code = codeTaken ? `${base}-${id}` : base;
      await tx.execute(sql`
        insert into access_groups (id, code, name, description, permissions, locked)
        overriding system value
        values (${id}, ${code}, ${name}, ${description}, ${textArray(permissions)}, false)
      `);
    }
    await tx
      .delete(accessGroupDepartments)
      .where(eq(accessGroupDepartments.accessGroupId, id));
    if (departmentIds.length) {
      await tx
        .insert(accessGroupDepartments)
        .values(
          departmentIds.map((departmentId) => ({
            accessGroupId: id,
            departmentId,
          })),
        );
    }
  });
  return { ok: true, label: name, before, after: await accessSnapshot(id) };
}

async function personLabel(userId: number) {
  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.name ?? null;
}

async function restoreApprover(snapshot: Snapshot): Promise<Outcome> {
  const userId = num(snapshot.userId);
  if (userId === null)
    return { ok: false, message: "Salinan data penyetuju tidak lengkap." };
  const name = await personLabel(userId);
  if (!name)
    return {
      ok: false,
      message: "Akun penyetuju ini sudah dihapus. Kembalikan akunnya dulu.",
    };

  const departmentIds = await existingDepartments(ids(snapshot.departmentIds));
  const before = await approverSnapshot(userId);
  await db.transaction(async (tx) => {
    await tx
      .delete(departmentApprovers)
      .where(eq(departmentApprovers.userId, userId));
    if (departmentIds.length) {
      await tx
        .insert(departmentApprovers)
        .values(
          departmentIds.map((departmentId) => ({ departmentId, userId })),
        );
    }
  });
  return { ok: true, label: name, before, after: await approverSnapshot(userId) };
}

async function restorePic(snapshot: Snapshot): Promise<Outcome> {
  const userId = num(snapshot.userId);
  if (userId === null)
    return {
      ok: false,
      message: "Salinan data Penanggung Jawab Ruang tidak lengkap.",
    };
  const name = await personLabel(userId);
  if (!name)
    return {
      ok: false,
      message:
        "Akun Penanggung Jawab Ruang ini sudah dihapus. Kembalikan akunnya dulu.",
    };

  const roomIds = await existingRooms(ids(snapshot.roomIds));
  const before = await picSnapshot(userId);
  await db.transaction(async (tx) => {
    await tx
      .update(rooms)
      .set({ picUserId: null })
      .where(
        roomIds.length
          ? and(eq(rooms.picUserId, userId), notInArray(rooms.id, roomIds))
          : eq(rooms.picUserId, userId),
      );
    if (roomIds.length)
      await tx
        .update(rooms)
        .set({ picUserId: userId })
        .where(inArray(rooms.id, roomIds));
  });
  return { ok: true, label: name, before, after: await picSnapshot(userId) };
}

async function restoreSettings(snapshot: Snapshot): Promise<Outcome> {
  const values = {
    draftTimeoutMinutes: num(snapshot.draftTimeoutMinutes) ?? 1440,
    operationalDays: ids(snapshot.operationalDays),
    openMinute: num(snapshot.openMinute) ?? 420,
    closeMinute: num(snapshot.closeMinute) ?? 1080,
  };
  if (
    values.openMinute >= values.closeMinute ||
    !values.operationalDays.length
  ) {
    return { ok: false, message: "Salinan aturan booking tidak valid." };
  }
  const before = await settingsSnapshot();
  await db
    .insert(appSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: appSettings.id, set: values });
  return {
    ok: true,
    label: "Aturan booking",
    before,
    after: await settingsSnapshot(),
  };
}

async function restoreDepartment(snapshot: Snapshot): Promise<Outcome> {
  const id = num(snapshot.id);
  const code = text(snapshot.code);
  const name = text(snapshot.name);
  if (id === null || !code || !name) return { ok: false, message: "Salinan data departemen tidak lengkap." };

  const [taken] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.code, code), ne(departments.id, id)))
    .limit(1);
  if (taken) return { ok: false, message: `Kode departemen "${code}" sudah dipakai departemen lain.` };

  const active = snapshot.active !== false;
  const before = await departmentSnapshot(id);
  if (before) {
    await db.update(departments).set({ code, name, active }).where(eq(departments.id, id));
  } else {
    await db.execute(sql`
      insert into departments (id, code, name, active)
      overriding system value
      values (${id}, ${code}, ${name}, ${active})
    `);
  }
  return { ok: true, label: `${name} (${code})`, before, after: await departmentSnapshot(id) };
}

const RESTORERS: Partial<
  Record<ActivityModule, (snapshot: Snapshot) => Promise<Outcome>>
> = {
  rooms: restoreRoom,
  users: restoreUser,
  access: restoreAccess,
  departments: restoreDepartment,
  approvers: restoreApprover,
  pic: restorePic,
  settings: restoreSettings,
};

export async function restoreActivityAction(
  logId: number,
): Promise<ActionResult> {
  if (!isId(logId)) return INVALID_REQUEST;
  const user = await getSessionUser();
  if (!user?.permissions.includes("activity.restore"))
    return { ok: false, message: "Anda tidak punya hak mengembalikan data." };
  if (!takeRateLimit("restore", user.id).allowed)
    return {
      ok: false,
      message:
        "Terlalu banyak pengembalian data. Tunggu sebentar, lalu coba lagi.",
    };

  const [log] = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.id, logId))
    .limit(1);
  if (!log)
    return {
      ok: false,
      message: "Aktivitas tidak ditemukan. Muat ulang halaman.",
    };
  if (!RESTORABLE_MODULES.has(log.module))
    return { ok: false, message: "Aktivitas ini tidak bisa dikembalikan." };

  const snapshot = log.action === "delete" ? log.before : log.after;
  const restore = RESTORERS[log.module];
  if (!snapshot || !restore)
    return {
      ok: false,
      message: "Aktivitas ini tidak menyimpan salinan data.",
    };

  let outcome: Outcome;
  try {
    outcome = await restore(snapshot);
  } catch (error) {
    console.error("[aktivitas] Gagal mengembalikan", error);
    return {
      ok: false,
      message: "Data gagal dikembalikan. Coba lagi atau periksa data terkait.",
    };
  }
  if (!outcome.ok) return outcome;

  const mode =
    log.action === "delete" ? "Dipasang kembali" : "Dikembalikan ke versi";
  await logActivity({
    action: "restore",
    module: log.module,
    targetId: log.targetId,
    targetLabel: outcome.label,
    detail: `${mode} dari aktivitas #${log.id} (${ACTIVITY_ACTION_LABEL[log.action]}, ${formatDateTime(log.createdAt)})`,
    before: outcome.before,
    after: outcome.after,
    restoredFromId: log.id,
  });

  for (const path of PATHS[log.module] ?? []) revalidatePath(path);
  revalidatePath("/pengaturan/riwayat-aktivitas");
  return {
    ok: true,
    message:
      log.action === "delete"
        ? `${outcome.label} dikembalikan.`
        : `${outcome.label} dikembalikan ke versi #${log.id}.`,
  };
}

export async function getActivityDetailAction(
  id: number,
): Promise<ActivityDetail | null> {
  if (!isId(id)) return null;
  const user = await getSessionUser();
  if (!user?.permissions.includes("activity.view")) return null;
  return getActivityDetail(id);
}
