import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarCheck, Clock, DoorOpen, Gauge } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getDaySchedule } from "@/backend/dashboard/queries";
import { closedReason, getSettings } from "@/backend/settings/queries";
import { DayNav } from "@/frontend/components/dashboard/day-nav";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import {
  MonitoringTable,
  type MonitoringRow,
} from "@/frontend/components/monitoring/monitoring-table";
import { StatCards } from "@/frontend/components/monitoring/stat-cards";
import { PageHead } from "@/frontend/components/ui/page-head";
import { formatLongDate } from "@/lib/format";
import { ROOM_STATUS_LABEL } from "@/lib/rooms";
import { formatClock, formatDuration, zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Monitoring" };

type MonitoringPageProps = { searchParams: Promise<{ tanggal?: string }> };

async function MonitoringContent({ searchParams }: MonitoringPageProps) {
  await requirePagePermission("dashboard.view");
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
  const span = settings.closeMinute - settings.openMinute;

  const rows: MonitoringRow[] = schedule.rooms.map((room) => {
    const list = schedule.bookings.filter(
      (booking) => booking.roomId === room.id,
    );
    const minutes = list.reduce(
      (sum, booking) => sum + booking.endMinute - booking.startMinute,
      0,
    );
    const active = room.status === "active";
    const current = isToday
      ? list.find(
          (booking) =>
            booking.status !== "done" &&
            booking.startMinute <= now.minute &&
            booking.endMinute > now.minute,
        )
      : undefined;
    const upcoming = list.find(
      (booking) =>
        booking.status !== "done" &&
        (!isToday || booking.startMinute > now.minute),
    );

    let stateLabel = list.length ? "Ada booking" : "Kosong";
    let stateTone: MonitoringRow["stateTone"] = list.length ? "info" : "ok";
    if (!active) {
      stateLabel = ROOM_STATUS_LABEL[room.status];
      stateTone = room.status === "repair" ? "warn" : "bad";
    } else if (closed) {
      stateLabel = "Tutup";
      stateTone = "gray";
    } else if (current) {
      stateLabel = `Dipakai s/d ${formatClock(current.endMinute)}`;
      stateTone = "gray";
    }

    return {
      id: room.id,
      name: room.name,
      department: room.departmentCode,
      capacity: room.capacity,
      active,
      drafts: list.filter((booking) => booking.status === "draft").length,
      count: list.length,
      minutes,
      occupancy: span > 0 ? Math.round((minutes / span) * 100) : 0,
      stateLabel,
      stateTone,
      next: current
        ? current.topic
        : upcoming
          ? `${isToday ? "Berikutnya" : "Pertama"} ${formatClock(upcoming.startMinute)}, ${upcoming.topic}`
          : (closed ?? "Tidak ada booking"),
    };
  });

  const activeRows = rows.filter((row) => row.active);
  const totalMinutes = rows.reduce((sum, row) => sum + row.minutes, 0);
  const averageOccupancy = activeRows.length
    ? Math.round(
        activeRows.reduce((sum, row) => sum + row.occupancy, 0) /
          activeRows.length,
      )
    : 0;
  const busiest = [...rows].sort((a, b) => b.minutes - a.minutes)[0];

  return (
    <>
      <PageHead
        title="Monitoring"
        description={`Pemakaian ruang pada ${formatLongDate(date)}.`}
      />
      <StatCards
        stats={[
          {
            label: "Total booking",
            value: String(schedule.bookings.length),
            note: closed ?? "Tidak termasuk yang batal atau ditolak",
            icon: CalendarCheck,
            tone: "blue",
          },
          {
            label: "Total pemakaian",
            value: totalMinutes ? formatDuration(totalMinutes) : "0 jam",
            note: "Semua ruang",
            icon: Clock,
            tone: "green",
          },
          {
            label: "Rata-rata tingkat pemakaian",
            value: `${averageOccupancy}%`,
            note: `Dari jam operasional ${formatClock(settings.openMinute)}–${formatClock(settings.closeMinute)}`,
            icon: Gauge,
            tone: "amber",
          },
          {
            label: "Ruang tersibuk",
            value: busiest && busiest.minutes ? busiest.name : "-",
            note:
              busiest && busiest.minutes
                ? formatDuration(busiest.minutes)
                : `${activeRows.length} ruang aktif`,
            icon: DoorOpen,
            tone: "violet",
          },
        ]}
      />
      <MonitoringTable
        rows={rows}
        date={date}
        nav={<DayNav date={date} today={now.date} basePath="/monitoring" />}
      />
    </>
  );
}

export default function MonitoringPage(props: MonitoringPageProps) {
  return (
    <Suspense fallback={<PageSkeleton variant="monitoring" />}>
      <MonitoringContent {...props} />
    </Suspense>
  );
}
