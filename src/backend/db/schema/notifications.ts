import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { users } from "./master";

export const notificationKind = pgEnum("notification_kind", ["approval_dept", "approval_room"]);

export const notifications = pgTable(
  "notifications",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: integer().references(() => bookings.id, { onDelete: "cascade" }),
    kind: notificationKind().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    href: text().notNull(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_booking_idx").on(table.bookingId),
  ],
);
