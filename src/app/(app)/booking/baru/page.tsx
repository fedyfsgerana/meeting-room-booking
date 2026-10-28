import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { listBookableDepartments } from "@/backend/departments/queries";
import { listRoomOptions } from "@/backend/rooms/queries";
import { getSettings } from "@/backend/settings/queries";
import { BookingForm } from "@/frontend/components/bookings/booking-form";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Booking ruang" };

type BookingBaruPageProps = {
  searchParams: Promise<{ ruang?: string; tanggal?: string; mulai?: string }>;
};

async function BookingBaruContent({ searchParams }: BookingBaruPageProps) {
  const me = await requirePagePermission("booking.create");
  const [rooms, departments, settings, params] = await Promise.all([
    listRoomOptions(),
    listBookableDepartments(me.id),
    getSettings(),
    searchParams,
  ]);
  const requestedRoom = Number(params.ruang);
  const today = zonedNow(new Date()).date;
  const requestedDate =
    params.tanggal &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.tanggal) &&
    params.tanggal >= today
      ? params.tanggal
      : undefined;
  const requestedStart =
    params.mulai && /^\d{2}:\d{2}$/.test(params.mulai)
      ? params.mulai
      : undefined;

  return (
    <BookingForm
      rooms={rooms}
      departments={departments}
      defaultDepartmentId={
        departments.some((item) => item.id === me.departmentId)
          ? me.departmentId
          : (departments[0]?.id ?? 0)
      }
      defaultRoomId={
        rooms.some((room) => room.id === requestedRoom)
          ? requestedRoom
          : undefined
      }
      defaultDate={requestedDate}
      defaultStart={requestedStart}
      today={today}
      openMinute={settings.openMinute}
      closeMinute={settings.closeMinute}
    />
  );
}

export default function BookingBaruPage(props: BookingBaruPageProps) {
  return (
    <>
      <PageHead
        title="Booking ruang"
        description="Ketersediaan ruang dicek langsung saat ruang, tanggal, dan jam diisi."
        actions={
          <ButtonLink href="/booking" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <BookingBaruContent {...props} />
      </Suspense>
    </>
  );
}
