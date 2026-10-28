import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePagePermission } from "@/backend/auth/guard";
import { listBookings } from "@/backend/bookings/queries";
import { BookingsManager } from "@/frontend/components/bookings/bookings-manager";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";

export const metadata: Metadata = { title: "Booking Ruang" };

async function BookingContent() {
  const me = await requirePagePermission("booking.view");
  const canManageAll = me.permissions.includes("booking.manage");
  const bookings = await listBookings(canManageAll ? undefined : me.id);
  return (
    <BookingsManager
      bookings={bookings}
      currentUserId={me.id}
      canManageAll={canManageAll}
      canCreate={me.permissions.includes("booking.create")}
      canReschedule={me.permissions.includes("booking.update")}
      canCancelOwn={me.permissions.includes("booking.delete")}
    />
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BookingContent />
    </Suspense>
  );
}
