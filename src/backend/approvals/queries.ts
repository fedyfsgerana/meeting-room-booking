import "server-only";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { SessionUser } from "@/backend/auth/session";
import { selectBookings } from "@/backend/bookings/queries";
import { db } from "@/backend/db/client";
import { bookings, departmentApprovers, rooms } from "@/backend/db/schema";
import {
  APPROVAL_MODES,
  APPROVAL_MODE_PERMISSION,
  type ApprovalMode,
} from "@/lib/approvals";

export function approvalModesFor(user: SessionUser): ApprovalMode[] {
  return APPROVAL_MODES.filter((mode) =>
    user.permissions.includes(APPROVAL_MODE_PERMISSION[mode]),
  );
}

function modeCondition(mode: ApprovalMode, user: SessionUser) {
  const all = user.permissions.includes("booking.manage");
  if (mode === "approver") {
    return and(
      eq(bookings.status, "draft"),
      gt(bookings.expiresAt, sql`now()`),
      all
        ? undefined
        : inArray(
            bookings.departmentId,
            db
              .select({ id: departmentApprovers.departmentId })
              .from(departmentApprovers)
              .where(eq(departmentApprovers.userId, user.id)),
          ),
    );
  }
  return and(
    eq(bookings.status, "pic"),
    all ? undefined : eq(rooms.picUserId, user.id),
  );
}

export async function listApprovals(mode: ApprovalMode, user: SessionUser) {
  return selectBookings()
    .where(modeCondition(mode, user))
    .orderBy(asc(bookings.date), asc(bookings.startMinute));
}

export async function countApprovals(user: SessionUser) {
  const modes = approvalModesFor(user);
  const counts = await Promise.all(
    modes.map(
      async (mode) => [mode, (await listApprovals(mode, user)).length] as const,
    ),
  );
  return Object.fromEntries(counts) as Partial<Record<ApprovalMode, number>>;
}
