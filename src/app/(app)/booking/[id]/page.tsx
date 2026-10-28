import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { canViewBooking } from "@/backend/bookings/access";
import { getBooking } from "@/backend/bookings/queries";
import { BookingActions } from "@/frontend/components/bookings/booking-actions";
import { BookingDetailView } from "@/frontend/components/bookings/booking-detail";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { originBack, originQuery, type Origin } from "@/lib/back-link";
import { ACTIVE_STATUSES } from "@/lib/bookings";
import { formatShortDate } from "@/lib/format";
import { formatClock } from "@/lib/time";

export const metadata: Metadata = { title: "Detail booking" };

type DetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Origin>;
};

async function DetailContent({ params, searchParams }: DetailPageProps) {
  const me = await requirePagePermission("booking.view");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const booking = await getBooking(id);
  if (!booking || !canViewBooking(me, booking)) notFound();

  const active = ACTIVE_STATUSES.includes(booking.status);
  const owner = booking.requesterId === me.id;
  const origin = await searchParams;

  return (
    <>
      <PageHead
        title="Detail booking"
        description="Data booking dan riwayat persetujuannya."
        actions={
          <div className="page-actions">
            <BookingActions
              bookingId={booking.id}
              summary={`${booking.topic} di ${booking.roomName}, ${formatShortDate(booking.date)} ${formatClock(booking.startMinute)}–${formatClock(booking.endMinute)}`}
              canReschedule={
                owner && active && me.permissions.includes("booking.update")
              }
              canCancel={
                active &&
                ((owner && me.permissions.includes("booking.delete")) ||
                  me.permissions.includes("booking.manage"))
              }
              returnQuery={originQuery(origin)}
            />
            <ButtonLink href={originBack(origin)} icon={ArrowLeft}>
              Kembali
            </ButtonLink>
          </div>
        }
      />
      <BookingDetailView booking={booking} />
    </>
  );
}

export default function DetailBookingPage(props: DetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton variant="form" />}>
      <DetailContent {...props} />
    </Suspense>
  );
}
