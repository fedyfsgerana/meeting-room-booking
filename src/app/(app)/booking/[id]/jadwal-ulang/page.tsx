import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getBooking } from "@/backend/bookings/queries";
import { getSettings } from "@/backend/settings/queries";
import { RescheduleForm } from "@/frontend/components/bookings/reschedule-form";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { ACTIVE_STATUSES } from "@/lib/bookings";
import { originQuery, type Origin } from "@/lib/back-link";
import { zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Jadwalkan ulang" };

type JadwalUlangPageProps = { params: Promise<{ id: string }>; searchParams: Promise<Origin> };

async function JadwalUlangContent({ params, searchParams }: JadwalUlangPageProps) {
  const me = await requirePagePermission("booking.update");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const booking = await getBooking(id);
  if (!booking || booking.requesterId !== me.id) notFound();
  const returnQuery = originQuery(await searchParams);
  if (!ACTIVE_STATUSES.includes(booking.status)) redirect(`/booking/${id}${returnQuery}`);

  const settings = await getSettings();

  return (
    <>
      <PageHead
        title="Jadwalkan ulang"
        description="Ubah tanggal atau jam booking."
        actions={
          <ButtonLink href={`/booking/${id}${returnQuery}`} icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <RescheduleForm
        booking={booking}
        today={zonedNow(new Date()).date}
        openMinute={settings.openMinute}
        closeMinute={settings.closeMinute}
        returnQuery={returnQuery}
      />
    </>
  );
}

export default function JadwalUlangPage(props: JadwalUlangPageProps) {
  return (
    <Suspense fallback={<PageSkeleton variant="form" />}>
      <JadwalUlangContent {...props} />
    </Suspense>
  );
}
