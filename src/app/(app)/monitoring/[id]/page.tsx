import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarCheck, Clock, Gauge, Users } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getDaySchedule } from "@/backend/dashboard/queries";
import { closedReason, getSettings } from "@/backend/settings/queries";
import { DayNav } from "@/frontend/components/dashboard/day-nav";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { RoomUsageTable } from "@/frontend/components/monitoring/room-usage-table";
import { StatCards } from "@/frontend/components/monitoring/stat-cards";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { formatLongDate } from "@/lib/format";
import { ROOM_STATUS_LABEL } from "@/lib/rooms";
import { formatClock, formatDuration, zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Pemakaian ruang" };

type PemakaianPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tanggal?: string }>;
};

async function PemakaianContent({ params, searchParams }: PemakaianPageProps) {
  const me = await requirePagePermission("dashboard.view");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const now = zonedNow(new Date());
  const requested = (await searchParams).tanggal;
  const date =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : now.date;

  const settings = await getSettings();
  const [schedule, closed] = await Promise.all([
    getDaySchedule(date),
    closedReason(date, settings),
  ]);
  const room = schedule.rooms.find((item) => item.id === id);
  if (!room) notFound();

  const canViewAll = me.permissions.some(
    (permission) =>
      permission === "booking.manage" ||
      permission === "approve_dept.view" ||
      permission === "approve_room.view",
  );
  const rows = schedule.bookings
    .filter((booking) => booking.roomId === id)
    .map((booking) => ({
      ...booking,
      viewable:
        me.permissions.includes("booking.view") &&
        (canViewAll || booking.requesterId === me.id),
    }));

  const minutes = rows.reduce(
    (sum, row) => sum + row.endMinute - row.startMinute,
    0,
  );
  const span = settings.closeMinute - settings.openMinute;
  const participants = rows.reduce(
    (sum, row) => sum + (row.participants ?? 0),
    0,
  );
  const backHref =
    date === now.date ? "/monitoring" : `/monitoring?tanggal=${date}`;

  return (
    <>
      <PageHead
        title={room.name}
        description={`Pemakaian ruang pada ${formatLongDate(date)} · ${room.departmentName ?? "Tanpa departemen"} · ${room.capacity} orang · ${ROOM_STATUS_LABEL[room.status]}`}
        actions={
          <ButtonLink href={backHref} icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <StatCards
        stats={[
          {
            label: "Jumlah booking",
            value: String(rows.length),
            note: closed ?? "Tidak termasuk yang batal atau ditolak",
            icon: CalendarCheck,
            tone: "teal",
          },
          {
            label: "Total pemakaian",
            value: minutes ? formatDuration(minutes) : "0 jam",
            note: "Pada tanggal ini",
            icon: Clock,
            tone: "indigo",
          },
          {
            label: "Tingkat pemakaian",
            value: `${span > 0 ? Math.round((minutes / span) * 100) : 0}%`,
            note: `Dari jam operasional ${formatClock(settings.openMinute)}–${formatClock(settings.closeMinute)}`,
            icon: Gauge,
            tone: "orange",
          },
          {
            label: "Total peserta",
            value: String(participants),
            note: "Dari semua booking",
            icon: Users,
            tone: "rose",
          },
        ]}
      />
      <RoomUsageTable
        rows={rows}
        roomId={id}
        date={date}
        nav={
          <DayNav date={date} today={now.date} basePath={`/monitoring/${id}`} />
        }
      />
    </>
  );
}

export default function PemakaianPage(props: PemakaianPageProps) {
  return (
    <Suspense fallback={<PageSkeleton variant="monitoring" />}>
      <PemakaianContent {...props} />
    </Suspense>
  );
}
