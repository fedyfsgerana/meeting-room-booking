import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, ne, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/backend/db/client";
import {
  accessGroups,
  departments,
  sessions,
  users,
} from "@/backend/db/schema";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import type { Permission } from "@/lib/permissions";

const SESSION_HOURS = 8;
const IDLE_MINUTES = 30;
export const REMEMBER_DAYS = 7;
const REMEMBER_IDLE_HOURS = 8;
const TOUCH_AFTER_MS = 60 * 1000;

function idleLimitMs(remember: boolean) {
  return remember
    ? REMEMBER_IDLE_HOURS * 60 * 60 * 1000
    : IDLE_MINUTES * 60 * 1000;
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  job: string;
  departmentId: number;
  department: string;
  access: string;
  accessCode: string;
  permissions: Permission[];
  mustChangePassword: boolean;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number, remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() +
      (remember
        ? REMEMBER_DAYS * 24 * 60 * 60 * 1000
        : SESSION_HOURS * 60 * 60 * 1000),
  );
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await db
    .insert(sessions)
    .values({ id: hashToken(token), userId, expiresAt, remember, userAgent });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { expires: expiresAt } : {}),
  });
}

async function loadSession(touch: boolean): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      job: users.jobTitle,
      departmentId: users.departmentId,
      departmentName: departments.name,
      departmentCode: departments.code,
      access: accessGroups.name,
      accessCode: accessGroups.code,
      permissions: accessGroups.permissions,
      mustChangePassword: users.mustChangePassword,
      sessionId: sessions.id,
      remember: sessions.remember,
      lastSeenAt: sessions.lastSeenAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(departments, eq(departments.id, users.departmentId))
    .innerJoin(accessGroups, eq(accessGroups.id, users.accessGroupId))
    .where(
      and(
        eq(sessions.id, hashToken(token)),
        gt(sessions.expiresAt, sql`now()`),
        eq(users.active, true),
      ),
    )
    .limit(1);

  if (!row) return null;

  const idleFor = Date.now() - row.lastSeenAt.getTime();
  if (idleFor > idleLimitMs(row.remember)) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }
  if (touch && idleFor > TOUCH_AFTER_MS) {
    await db
      .update(sessions)
      .set({ lastSeenAt: sql`now()` })
      .where(eq(sessions.id, row.sessionId));
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    job: row.job,
    departmentId: row.departmentId,
    department: `${row.departmentName} (${row.departmentCode})`,
    access: row.access,
    accessCode: row.accessCode,
    permissions: row.mustChangePassword
      ? []
      : (row.permissions as Permission[]),
    mustChangePassword: row.mustChangePassword,
  };
}

export const getSessionUser = cache(() => loadSession(true));

export const peekSessionUser = cache(() => loadSession(false));

export async function deleteCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

export async function deleteUserSessions(userId: number, keepCurrent = false) {
  const token = keepCurrent
    ? (await cookies()).get(SESSION_COOKIE)?.value
    : undefined;
  const condition = token
    ? and(eq(sessions.userId, userId), ne(sessions.id, hashToken(token)))
    : eq(sessions.userId, userId);
  await db.delete(sessions).where(condition);
}
