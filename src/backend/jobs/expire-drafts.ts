import "server-only";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { bookingEvents, bookings } from "@/backend/db/schema";
import { resolveNotifications } from "@/backend/notifications/service";

export async function expireDrafts() {
  const ids = await db.transaction(async (tx) => {
    const expired = await tx
      .update(bookings)
      .set({
        status: "expired",
        reason: "Tidak disetujui penyetuju sampai batas waktu.",
      })
      .where(
        and(eq(bookings.status, "draft"), lte(bookings.expiresAt, sql`now()`)),
      )
      .returning({ id: bookings.id });

    if (expired.length) {
      await tx.insert(bookingEvents).values(
        expired.map((row) => ({
          bookingId: row.id,
          type: "expired" as const,
          note: "Tidak disetujui penyetuju sampai batas waktu.",
        })),
      );
    }

    return expired.map((row) => row.id);
  });

  await resolveNotifications(ids);
  return ids.length;
}
