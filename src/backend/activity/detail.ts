import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/client";
import {
  accessGroups,
  activityLogs,
  departments,
  rooms,
  users,
} from "@/backend/db/schema";
import {
  RESTORABLE_MODULES,
  deviceLabel,
  type ActivityModule,
} from "@/lib/activity";
import { PERMISSION_LABEL, type Permission } from "@/lib/permissions";
import { ROOM_STATUS_LABEL, facilityLabel, type RoomStatus } from "@/lib/rooms";
import {
  DAY_LABELS,
  DAY_ORDER,
  durationLabel,
  minutesToTime,
} from "@/lib/settings";

type Snapshot = Record<string, unknown>;
type Lookup = {
  departments: Map<number, string>;
  users: Map<number, string>;
  groups: Map<number, string>;
  rooms: Map<number, string>;
};
type FieldDef = {
  key: string;
  label: string;
  format?: (value: unknown, lookup: Lookup) => string;
  items?: (value: unknown, lookup: Lookup) => string[];
};

const list = (value: unknown) => (Array.isArray(value) ? value : []);
const idList = (value: unknown) =>
  list(value).filter((item): item is number => typeof item === "number");
const pick = (map: Map<number, string>) => (value: unknown) =>
  typeof value === "number" ? (map.get(value) ?? `#${value}`) : "-";
const nameItems = (map: Map<number, string>, value: unknown) =>
  idList(value).map((id) => map.get(id) ?? `#${id}`);
const names = (map: Map<number, string>, value: unknown) =>
  nameItems(map, value).join(", ") || "-";
const yesNo = (yes: string, no: string) => (value: unknown) =>
  value === true ? yes : value === false ? no : "-";

const FIELDS: Partial<Record<ActivityModule, FieldDef[]>> = {
  rooms: [
    { key: "name", label: "Nama ruang" },
    { key: "location", label: "Lokasi" },
    {
      key: "departmentId",
      label: "Departemen",
      format: (value, l) => pick(l.departments)(value),
    },
    {
      key: "capacity",
      label: "Kapasitas",
      format: (value) => (typeof value === "number" ? `${value} orang` : "-"),
    },
    {
      key: "status",
      label: "Status",
      format: (value) => ROOM_STATUS_LABEL[value as RoomStatus] ?? "-",
    },
    {
      key: "facilities",
      label: "Fasilitas",
      format: (value) =>
        list(value)
          .map((item) => facilityLabel(String(item)))
          .join(", ") || "-",
      items: (value) => list(value).map((item) => facilityLabel(String(item))),
    },
    {
      key: "picUserId",
      label: "Penanggung Jawab Ruang",
      format: (value, l) => pick(l.users)(value),
    },
  ],
  users: [
    { key: "name", label: "Nama lengkap" },
    {
      key: "departmentId",
      label: "Departemen",
      format: (value, l) => pick(l.departments)(value),
    },
    { key: "jobTitle", label: "Jabatan" },
    {
      key: "accessGroupId",
      label: "Hak akses",
      format: (value, l) => pick(l.groups)(value),
    },
    { key: "email", label: "Email" },
    { key: "active", label: "Status akun", format: yesNo("Aktif", "Nonaktif") },
    {
      key: "approverOf",
      label: "Penyetuju di",
      format: (value, l) => names(l.departments, value),
      items: (value, l) => nameItems(l.departments, value),
    },
    {
      key: "picOf",
      label: "Penanggung Jawab Ruang di",
      format: (value, l) => names(l.rooms, value),
      items: (value, l) => nameItems(l.rooms, value),
    },
  ],
  access: [
    { key: "name", label: "Nama hak akses" },
    { key: "description", label: "Deskripsi" },
    {
      key: "permissions",
      label: "Menu dan aksi",
      format: (value) =>
        list(value)
          .map((item) => PERMISSION_LABEL[item as Permission] ?? String(item))
          .join(", ") || "-",
      items: (value) =>
        list(value).map(
          (item) => PERMISSION_LABEL[item as Permission] ?? String(item),
        ),
    },
    {
      key: "departmentIds",
      label: "Departemen yang bisa dipesankan",
      format: (value, l) => names(l.departments, value),
      items: (value, l) => nameItems(l.departments, value),
    },
  ],
  departments: [
    { key: "code", label: "Kode" },
    { key: "name", label: "Nama departemen" },
    { key: "active", label: "Status", format: yesNo("Aktif", "Nonaktif") },
  ],
  approvers: [
    {
      key: "departmentIds",
      label: "Departemen yang disetujui",
      format: (value, l) => names(l.departments, value),
      items: (value, l) => nameItems(l.departments, value),
    },
  ],
  pic: [
    {
      key: "roomIds",
      label: "Ruang yang dipegang",
      format: (value, l) => names(l.rooms, value),
      items: (value, l) => nameItems(l.rooms, value),
    },
  ],
  settings: [
    {
      key: "draftTimeoutMinutes",
      label: "Batas waktu Draft",
      format: (value) =>
        typeof value === "number" ? durationLabel(value) : "-",
    },
    {
      key: "operationalDays",
      label: "Hari operasional",
      format: (value) => {
        const days = idList(value);
        return (
          DAY_ORDER.filter((day) => days.includes(day))
            .map((day) => DAY_LABELS[day])
            .join(", ") || "-"
        );
      },
    },
    {
      key: "openMinute",
      label: "Jam buka",
      format: (value) =>
        typeof value === "number" ? minutesToTime(value) : "-",
    },
    {
      key: "closeMinute",
      label: "Jam tutup",
      format: (value) =>
        typeof value === "number" ? minutesToTime(value) : "-",
    },
  ],
};

async function lookups(snapshots: Snapshot[]): Promise<Lookup> {
  const collect = (keys: string[]) => [
    ...new Set(
      snapshots.flatMap((item) =>
        keys.flatMap((key) =>
          Array.isArray(item[key])
            ? idList(item[key])
            : typeof item[key] === "number"
              ? [item[key] as number]
              : [],
        ),
      ),
    ),
  ];
  const departmentIds = collect(["departmentId", "departmentIds", "approverOf"]);
  const userIds = collect(["picUserId", "userId"]);
  const groupIds = collect(["accessGroupId"]);
  const roomIds = collect(["roomIds", "picOf"]);

  const [departmentRows, userRows, groupRows, roomRows] = await Promise.all([
    departmentIds.length
      ? db
          .select({ id: departments.id, label: departments.code })
          .from(departments)
          .where(inArray(departments.id, departmentIds))
      : [],
    userIds.length
      ? db
          .select({ id: users.id, label: users.name })
          .from(users)
          .where(inArray(users.id, userIds))
      : [],
    groupIds.length
      ? db
          .select({ id: accessGroups.id, label: accessGroups.name })
          .from(accessGroups)
          .where(inArray(accessGroups.id, groupIds))
      : [],
    roomIds.length
      ? db
          .select({ id: rooms.id, label: rooms.name })
          .from(rooms)
          .where(inArray(rooms.id, roomIds))
      : [],
  ]);
  const toMap = (rows: Array<{ id: number; label: string }>) =>
    new Map(rows.map((row) => [row.id, row.label]));
  return {
    departments: toMap(departmentRows),
    users: toMap(userRows),
    groups: toMap(groupRows),
    rooms: toMap(roomRows),
  };
}

export async function getActivityDetail(id: number) {
  const [log] = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.id, id))
    .limit(1);
  if (!log) return null;

  const defs = FIELDS[log.module] ?? [];
  const before = log.before;
  const after = log.after;
  const lookup = await lookups(
    [before, after].filter((item): item is Snapshot => item !== null),
  );

  const show = (def: FieldDef, snapshot: Snapshot | null) => {
    if (!snapshot) return null;
    const value = snapshot[def.key];
    if (def.format) return def.format(value, lookup);
    return value === null || value === undefined || value === ""
      ? "-"
      : String(value);
  };

  const fields = defs
    .map((def) => {
      const previous = show(def, before);
      const next = show(def, after);
      const compared = before !== null && after !== null;
      let added: string[] = [];
      let removed: string[] = [];
      if (compared && def.items) {
        const oldItems = def.items(before[def.key], lookup);
        const newItems = def.items(after[def.key], lookup);
        added = newItems.filter((item) => !oldItems.includes(item));
        removed = oldItems.filter((item) => !newItems.includes(item));
      }
      const changed =
        compared &&
        (def.items
          ? added.length > 0 || removed.length > 0
          : previous !== next);
      return {
        label: def.label,
        before: previous,
        after: next,
        changed,
        added,
        removed,
        list: Boolean(def.items),
      };
    })
    .filter((field) => field.before !== null || field.after !== null);

  const snapshot = log.action === "delete" ? before : after;
  return {
    id: log.id,
    action: log.action,
    module: log.module,
    actorName: log.actorName,
    targetLabel: log.targetLabel,
    detail: log.detail,
    ipAddress:
      log.ipAddress === "::1" || log.ipAddress === "127.0.0.1"
        ? `${log.ipAddress} (komputer ini)`
        : log.ipAddress,
    device: deviceLabel(log.userAgent),
    createdAt: log.createdAt,
    restoredFromId: log.restoredFromId,
    restorable: RESTORABLE_MODULES.has(log.module) && snapshot !== null,
    compared: before !== null && after !== null,
    fields,
  };
}

export type ActivityDetail = NonNullable<
  Awaited<ReturnType<typeof getActivityDetail>>
>;
