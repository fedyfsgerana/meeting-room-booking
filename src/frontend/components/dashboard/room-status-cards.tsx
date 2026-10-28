import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import type {
  ScheduleBooking,
  ScheduleRoom,
} from "@/backend/dashboard/queries";
import { cx } from "@/lib/cx";
import { ROOM_STATUS_LABEL } from "@/lib/rooms";
import { formatClock } from "@/lib/time";

type RoomStatusCardsProps = {
  rooms: ScheduleRoom[];
  bookings: ScheduleBooking[];
  isToday: boolean;
  nowMinute: number;
  closeMinute: number;
  date: string;
  canBook: boolean;
};

type Tone = "ok" | "busy" | "warn" | "bad" | "muted";

export function RoomStatusCards({
  rooms,
  bookings,
  isToday,
  nowMinute,
  closeMinute,
  date,
  canBook,
}: RoomStatusCardsProps) {
  return (
    <div className="now-strip">
      {rooms.map((room) => {
        const list = bookings.filter(
          (booking) => booking.roomId === room.id && booking.status !== "done",
        );
        const current = isToday
          ? list.find(
              (booking) =>
                booking.startMinute <= nowMinute &&
                booking.endMinute > nowMinute,
            )
          : undefined;
        const next = list.find(
          (booking) => booking.startMinute >= (isToday ? nowMinute : 0),
        );
        const unavailable = room.status !== "active";
        const closed = isToday && nowMinute >= closeMinute;

        let state = list.length ? `${list.length} booking` : "Kosong";
        let tone: Tone = list.length ? "busy" : "ok";
        let note = list.length
          ? `Pertama ${formatClock(list[0].startMinute)}, ${list[0].topic}`
          : "Belum ada booking";
        if (unavailable) {
          state = ROOM_STATUS_LABEL[room.status];
          tone = room.status === "repair" ? "warn" : "bad";
          note = "Sementara tidak bisa dipesan";
        } else if (current) {
          state = `Dipakai s/d ${formatClock(current.endMinute)}`;
          tone = "busy";
          note = current.topic;
        } else if (isToday) {
          state = closed
            ? "Tutup"
            : next
              ? `Kosong s/d ${formatClock(next.startMinute)}`
              : "Kosong";
          tone = closed ? "muted" : "ok";
          note = next
            ? `Berikutnya ${next.topic}`
            : "Tidak ada booking lagi hari ini";
        }

        return (
          <div key={room.id} className={cx("now-card", `tone-${tone}`)}>
            <div className="stat-head">
              <span className="stat-label">{room.name}</span>
              <span className="n-cap">{room.capacity} orang</span>
            </div>
            <div className={cx("n-state", `t-${tone}`)}>
              <i aria-hidden="true" />
              {state}
            </div>
            <div className="n-sub">{note}</div>
            {canBook && !unavailable && !closed && (
              <Link
                className="n-cta"
                href={`/booking/baru?ruang=${room.id}${isToday ? "" : `&tanggal=${date}`}`}
              >
                <CalendarPlus aria-hidden="true" />
                Booking ruang ini
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
