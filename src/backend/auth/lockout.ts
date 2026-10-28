import "server-only";
import { and, count, eq, gt, min, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { activityLogs } from "@/backend/db/schema";

const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_ADDRESS = 5;
const MAX_FAILURES_PER_ACCOUNT = 20;

type LockState = { locked: false } | { locked: true; retryMinutes: number };

function retryFrom(oldest: Date | null) {
  if (!oldest) return WINDOW_MINUTES;
  const unlockAt = oldest.getTime() + WINDOW_MINUTES * 60_000;
  return Math.max(1, Math.ceil((unlockAt - Date.now()) / 60_000));
}

export async function loginLockState(
  email: string,
  ipAddress: string | null,
): Promise<LockState> {
  const since = sql`now() - (${WINDOW_MINUTES} * interval '1 minute')`;
  const failed = and(
    eq(activityLogs.action, "login_failed"),
    gt(activityLogs.createdAt, since),
  );

  if (ipAddress) {
    const [byAddress] = await db
      .select({ total: count(), oldest: min(activityLogs.createdAt) })
      .from(activityLogs)
      .where(and(failed, eq(activityLogs.ipAddress, ipAddress)));
    if ((byAddress?.total ?? 0) >= MAX_FAILURES_PER_ADDRESS) {
      return {
        locked: true,
        retryMinutes: retryFrom(byAddress?.oldest ?? null),
      };
    }
  }

  const [byAccount] = await db
    .select({ total: count(), oldest: min(activityLogs.createdAt) })
    .from(activityLogs)
    .where(
      and(
        failed,
        sql`lower(${activityLogs.targetLabel}) = ${email.toLowerCase()}`,
        sql`${activityLogs.createdAt} > coalesce((
          select max(success.created_at) from activity_logs success
          where success.action = 'login' and success.user_id = ${activityLogs.userId}
        ), 'epoch'::timestamptz)`,
      ),
    );
  if ((byAccount?.total ?? 0) >= MAX_FAILURES_PER_ACCOUNT) {
    return { locked: true, retryMinutes: retryFrom(byAccount?.oldest ?? null) };
  }

  return { locked: false };
}
