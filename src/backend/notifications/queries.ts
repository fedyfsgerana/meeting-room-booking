import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { notifications } from "@/backend/db/schema";

export async function listNotifications(userId: number, limit = 20) {
  const [items, [unread]] = await Promise.all([
    db
      .select({
        id: notifications.id,
        kind: notifications.kind,
        title: notifications.title,
        body: notifications.body,
        href: notifications.href,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit),
    db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      ),
  ]);
  return { unread: unread?.total ?? 0, items };
}

export type NotificationFeed = Awaited<ReturnType<typeof listNotifications>>;
export type NotificationItem = NotificationFeed["items"][number];
