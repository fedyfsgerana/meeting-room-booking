import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db/client";
import { activityLogs, users } from "@/backend/db/schema";
import type { ActivityAction, ActivityModule } from "@/lib/activity";

type ActivityInput = {
  action: ActivityAction;
  module: ActivityModule;
  targetId?: number | null;
  targetLabel?: string | null;
  detail?: string | null;
  targetUserId?: number;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  restoredFromId?: number;
  actor?: { id: number; name: string } | null;
};

export async function clientInfo() {
  const list = await headers();
  const forwarded = list
    .get("x-forwarded-for")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .at(-1);
  return {
    ipAddress: list.get("x-real-ip")?.trim() || forwarded || null,
    userAgent: list.get("user-agent")?.slice(0, 300) ?? null,
  };
}

export async function logActivity(input: ActivityInput) {
  try {
    const actor =
      input.actor === undefined ? await getSessionUser() : input.actor;
    const client = await clientInfo();
    let targetLabel = input.targetLabel ?? null;
    if (!targetLabel && input.targetUserId) {
      const [row] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.targetUserId))
        .limit(1);
      targetLabel = row?.name ?? null;
    }
    await db.insert(activityLogs).values({
      userId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      action: input.action,
      module: input.module,
      targetId: input.targetId ?? input.targetUserId ?? null,
      targetLabel: targetLabel?.slice(0, 200) ?? null,
      detail: input.detail?.slice(0, 500) ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      restoredFromId: input.restoredFromId ?? null,
      ...client,
    });
  } catch (error) {
    console.error("[aktivitas] Gagal mencatat", error);
  }
}
