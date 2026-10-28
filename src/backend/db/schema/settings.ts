import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";

export const appSettings = pgTable(
  "app_settings",
  {
    id: integer().primaryKey().default(1),
    draftTimeoutMinutes: integer().notNull().default(1440),
    operationalDays: integer()
      .array()
      .notNull()
      .default(sql`'{1,2,3,4,5,6}'::integer[]`),
    openMinute: integer().notNull().default(420),
    closeMinute: integer().notNull().default(1080),
    ...timestamps,
  },
  (table) => [
    check("app_settings_singleton", sql`${table.id} = 1`),
    check(
      "app_settings_hours",
      sql`${table.openMinute} >= 0 and ${table.closeMinute} <= 1440 and ${table.openMinute} < ${table.closeMinute}`,
    ),
  ],
);

export const holidays = pgTable("holidays", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  date: date({ mode: "string" }).notNull().unique(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
