import "server-only";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { activityLogs } from "@/backend/db/schema";
import type { ActivityModule } from "@/lib/activity";
import { toDateTime } from "@/lib/time";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function listActivities(
  from: string,
  to: string,
  moduleKey: ActivityModule | null = null,
) {
  return db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      actorName: activityLogs.actorName,
      action: activityLogs.action,
      module: activityLogs.module,
      targetLabel: activityLogs.targetLabel,
      detail: activityLogs.detail,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      createdAt: activityLogs.createdAt,
      hasSnapshot: sql<boolean>`(case when ${activityLogs.action} = 'delete' then ${activityLogs.before} else ${activityLogs.after} end) is not null`,
    })
    .from(activityLogs)
    .where(
      and(
        gte(activityLogs.createdAt, toDateTime(from, 0)),
        lt(
          activityLogs.createdAt,
          new Date(toDateTime(to, 0).getTime() + DAY_MS),
        ),
        moduleKey ? eq(activityLogs.module, moduleKey) : undefined,
      ),
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(2000);
}

export type ActivityRow = Awaited<ReturnType<typeof listActivities>>[number];
