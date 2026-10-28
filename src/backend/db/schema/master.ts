import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";

export const roomStatus = pgEnum("room_status", ["active", "repair", "off"]);

export const departments = pgTable("departments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: text().notNull().unique(),
  name: text().notNull(),
  active: boolean().notNull().default(true),
  ...timestamps,
});

export const accessGroups = pgTable("access_groups", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: text().notNull().unique(),
  name: text().notNull(),
  description: text().notNull().default(""),
  permissions: text()
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  locked: boolean().notNull().default(false),
  ...timestamps,
});

export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: text().notNull(),
    name: text().notNull(),
    jobTitle: text().notNull(),
    departmentId: integer()
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    accessGroupId: integer()
      .notNull()
      .references(() => accessGroups.id, { onDelete: "restrict" }),
    passwordHash: text().notNull(),
    mustChangePassword: boolean().notNull().default(false),
    active: boolean().notNull().default(true),
    lastLoginAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_lower_key").on(sql`lower(${table.email})`),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    location: text().notNull(),
    capacity: integer().notNull(),
    departmentId: integer().references(() => departments.id, {
      onDelete: "set null",
    }),
    status: roomStatus().notNull().default("active"),
    facilities: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    picUserId: integer().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("rooms_name_lower_key").on(sql`lower(${table.name})`),
    check("rooms_capacity_positive", sql`${table.capacity} > 0`),
  ],
);

export const accessGroupDepartments = pgTable(
  "access_group_departments",
  {
    accessGroupId: integer()
      .notNull()
      .references(() => accessGroups.id, { onDelete: "cascade" }),
    departmentId: integer()
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.accessGroupId, table.departmentId] }),
  ],
);

export const departmentApprovers = pgTable(
  "department_approvers",
  {
    departmentId: integer()
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.departmentId, table.userId] })],
);
