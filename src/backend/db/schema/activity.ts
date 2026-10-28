import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./master";

export const activityAction = pgEnum("activity_action", [
  "login",
  "login_failed",
  "logout",
  "create",
  "update",
  "delete",
  "activate",
  "deactivate",
  "reset_password",
  "sync",
  "submit",
  "reschedule",
  "cancel",
  "approve",
  "reject",
  "check",
  "restore",
  "change_password",
]);

export const activityModule = pgEnum("activity_module", [
  "auth",
  "rooms",
  "approvers",
  "pic",
  "users",
  "access",
  "settings",
  "departments",
  "bookings",
  "approvals",
]);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id, { onDelete: "set null" }),
    actorName: text(),
    action: activityAction().notNull(),
    module: activityModule().notNull(),
    targetId: integer(),
    targetLabel: text(),
    detail: text(),
    before: jsonb().$type<Record<string, unknown>>(),
    after: jsonb().$type<Record<string, unknown>>(),
    restoredFromId: integer(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_logs_created_idx").on(table.createdAt),
    index("activity_logs_user_idx").on(table.userId),
  ],
);
