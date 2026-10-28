import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { bookingEvents, bookings } from "@/backend/db/schema";
import { APP_TIME_ZONE } from "@/lib/time";

export async function completeBookings() {
  return db.transaction(async (tx) => {
    const finished = await tx
      .update(bookings)
      .set({ status: "done" })
      .where(
        and(
          eq(bookings.status, "approved"),
          sql`(${bookings.date}::timestamp + make_interval(mins => ${bookings.endMinute})) at time zone ${APP_TIME_ZONE} <= now()`,
        ),
      )
      .returning({ id: bookings.id });

    if (finished.length) {
      await tx.insert(bookingEvents).values(
        finished.map((row) => ({
          bookingId: row.id,
          type: "finished" as const,
          note: "Selesai otomatis setelah jam booking berakhir.",
        })),
      );
    }

    return finished.length;
  });
}
