import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { departments, rooms, users } from "./master";

export const bookingStatus = pgEnum("booking_status", [
  "draft",
  "pic",
  "approved",
  "done",
  "rejected",
  "cancelled",
  "expired",
  "rescheduled",
]);

export const bookingEventType = pgEnum("booking_event_type", [
  "submitted",
  "rescheduled",
  "approved_dept",
  "checked_room",
  "finished",
  "rejected",
  "cancelled",
  "expired",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    roomId: integer()
      .notNull()
      .references(() => rooms.id, { onDelete: "restrict" }),
    requesterId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    departmentId: integer()
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    approverId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    topic: text().notNull(),
    date: date({ mode: "string" }).notNull(),
    startMinute: integer().notNull(),
    endMinute: integer().notNull(),
    participants: integer(),
    teleconference: boolean().notNull().default(false),
    teleApp: text(),
    host: boolean(),
    counterpart: text(),
    notes: text(),
    rescheduledFromId: integer().references((): AnyPgColumn => bookings.id, {
      onDelete: "set null",
    }),
    status: bookingStatus().notNull().default("draft"),
    expiresAt: timestamp({ withTimezone: true }),
    reason: text(),
    ...timestamps,
  },
  (table) => [
    index("bookings_room_date_idx").on(table.roomId, table.date),
    index("bookings_requester_idx").on(table.requesterId),
    index("bookings_status_idx").on(table.status),
    check(
      "bookings_time_range",
      sql`${table.startMinute} >= 0 and ${table.endMinute} <= 1440 and ${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "bookings_participants_positive",
      sql`${table.participants} is null or ${table.participants} > 0`,
    ),
  ],
);

export const bookingEvents = pgTable(
  "booking_events",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    bookingId: integer()
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    type: bookingEventType().notNull(),
    actorId: integer().references(() => users.id, { onDelete: "set null" }),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("booking_events_booking_idx").on(table.bookingId)],
);
