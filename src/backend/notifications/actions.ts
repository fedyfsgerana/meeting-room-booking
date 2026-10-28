"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getSessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import { notifications } from "@/backend/db/schema";
import { isId } from "@/lib/args";

export async function markNotificationReadAction(id: number) {
  if (!isId(id)) return;
  const user = await getSessionUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, user.id),
        isNull(notifications.readAt),
      ),
    );
}

export async function markAllNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(eq(notifications.userId, user.id), isNull(notifications.readAt)),
    );
}
