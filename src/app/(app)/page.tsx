import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getDaySchedule } from "@/backend/dashboard/queries";
import { closedReason, getSettings } from "@/backend/settings/queries";
import { DayNav } from "@/frontend/components/dashboard/day-nav";
import { DayTimeline } from "@/frontend/components/dashboard/day-timeline";
import { RoomStatusCards } from "@/frontend/components/dashboard/room-status-cards";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { PageHead } from "@/frontend/components/ui/page-head";
import { zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Beranda" };

type BerandaPageProps = { searchParams: Promise<{ tanggal?: string }> };

async function BerandaContent({ searchParams }: BerandaPageProps) {
  const me = await requirePagePermission("dashboard.view");
  const now = zonedNow(new Date());
  const requested = (await searchParams).tanggal;
  const date =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : now.date;
  const isToday = date === now.date;

  const settings = await getSettings();
  const [schedule, closed] = await Promise.all([
    getDaySchedule(date),
    closedReason(date, settings),
  ]);
  const canBook = me.permissions.includes("booking.create") && date >= now.date;
  const activeRooms = schedule.rooms.filter((room) => room.status === "active");
  const busyNow = isToday
    ? activeRooms.filter((room) =>
        schedule.bookings.some(
          (booking) =>
            booking.roomId === room.id &&
            booking.status !== "done" &&
            booking.startMinute <= now.minute &&
            booking.endMinute > now.minute,
        ),
      ).length
    : 0;

  return (
    <>
      <PageHead
        title="Beranda"
        description={
          isToday
            ? `${activeRooms.length - busyNow} dari ${activeRooms.length} ruang sedang kosong. Klik bagian kosong di jadwal untuk langsung booking.`
            : "Jadwal pemakaian ruang pada tanggal yang dipilih."
        }
      />
      <RoomStatusCards
        rooms={schedule.rooms}
        bookings={schedule.bookings}
        isToday={isToday}
        nowMinute={now.minute}
        closeMinute={settings.closeMinute}
        date={date}
        canBook={canBook && !closed}
      />
      <DayTimeline
        date={date}
        rooms={schedule.rooms}
        bookings={schedule.bookings}
        openMinute={settings.openMinute}
        closeMinute={settings.closeMinute}
        nowMinute={
          isToday ? now.minute : date < now.date ? settings.closeMinute : null
        }
        closedReason={closed}
        canBook={canBook}
        canViewAll={me.permissions.some(
          (permission) =>
            permission === "booking.manage" ||
            permission === "approve_dept.view" ||
            permission === "approve_room.view",
        )}
        currentUserId={me.id}
        nav={<DayNav date={date} today={now.date} />}
      />
    </>
  );
}

export default function BerandaPage(props: BerandaPageProps) {
  return (
    <Suspense fallback={<PageSkeleton variant="dashboard" />}>
      <BerandaContent {...props} />
    </Suspense>
  );
}
