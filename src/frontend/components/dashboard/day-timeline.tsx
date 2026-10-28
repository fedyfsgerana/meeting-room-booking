import Link from "next/link";
import type { ReactNode } from "react";
import type {
  ScheduleBooking,
  ScheduleRoom,
} from "@/backend/dashboard/queries";
import { DoorOpen } from "lucide-react";
import { Card, CardHeader } from "@/frontend/components/ui/card";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { cx } from "@/lib/cx";
import { formatLongDate } from "@/lib/format";
import { BOOKING_STATUS_LABEL } from "@/lib/bookings";
import { minutesToTime } from "@/lib/settings";
import { formatClock } from "@/lib/time";

type DayTimelineProps = {
  date: string;
  rooms: ScheduleRoom[];
  bookings: ScheduleBooking[];
  openMinute: number;
  closeMinute: number;
  nowMinute: number | null;
  closedReason: string | null;
  canBook: boolean;
  canViewAll: boolean;
  currentUserId: number;
  nav: ReactNode;
};

export function DayTimeline({
  date,
  rooms,
  bookings,
  openMinute,
  closeMinute,
  nowMinute,
  closedReason,
  canBook,
  canViewAll,
  currentUserId,
  nav,
}: DayTimelineProps) {
  const span = closeMinute - openMinute;
  const pct = (minute: number) => ((minute - openMinute) / span) * 100;
  const hours: number[] = [];
  for (
    let minute = Math.ceil(openMinute / 60) * 60;
    minute <= closeMinute;
    minute += 60
  )
    hours.push(minute);
  const nowPos =
    nowMinute !== null && nowMinute > openMinute && nowMinute < closeMinute
      ? nowMinute
      : null;
  const slotStarts: number[] = [];
  for (let minute = openMinute; minute < closeMinute; minute += 60)
    slotStarts.push(minute);

  return (
    <Card className="timeline-card">
      <CardHeader
        title={formatLongDate(date)}
        description={closedReason ?? `${bookings.length} booking tercatat`}
        actions={nav}
      />
      {rooms.length === 0 && (
        <EmptyState
          icon={DoorOpen}
          title="Belum ada ruangan"
          description="Hubungi administrator untuk menambahkan ruangan."
        />
      )}
      <div className="tl-scroll" hidden={rooms.length === 0}>
        <div className="tl">
          <div className="tl-head">
            <span />
            <div className="tl-hours">
              {hours.map((minute) => (
                <span key={minute} style={{ left: `${pct(minute)}%` }}>
                  {formatClock(minute)}
                </span>
              ))}
              {nowPos !== null && (
                <span className="now-tag" style={{ left: `${pct(nowPos)}%` }}>
                  {formatClock(nowPos)}
                </span>
              )}
            </div>
          </div>
          {rooms.map((room) => {
            const blocked = room.status !== "active" || closedReason !== null;
            const list = bookings.filter(
              (booking) => booking.roomId === room.id,
            );
            return (
              <div key={room.id} className="tl-row">
                <div className="tl-room">
                  <b>{room.name}</b>
                  <span>{room.capacity} orang</span>
                </div>
                <div className={cx("tl-track", blocked && "blocked")}>
                  {hours.map((minute) => (
                    <i
                      key={minute}
                      className="tl-grid"
                      style={{ left: `${pct(minute)}%` }}
                    />
                  ))}
                  {!blocked &&
                    canBook &&
                    slotStarts.map((minute) => {
                      const end = Math.min(minute + 60, closeMinute);
                      const past = nowMinute !== null && end <= nowMinute;
                      const taken = list.some(
                        (booking) =>
                          booking.startMinute < end &&
                          booking.endMinute > minute,
                      );
                      if (past || taken) return null;
                      return (
                        <Link
                          key={minute}
                          className="tl-free"
                          style={{
                            left: `${pct(minute)}%`,
                            width: `${pct(end) - pct(minute)}%`,
                          }}
                          href={`/booking/baru?ruang=${room.id}&tanggal=${date}&mulai=${minutesToTime(minute)}`}
                          aria-label={`Booking ${room.name} jam ${formatClock(minute)}`}
                        >
                          <span>+ {formatClock(minute)}</span>
                        </Link>
                      );
                    })}
                  {blocked && (
                    <span className="tl-blocked">
                      {closedReason
                        ? "Tutup"
                        : room.status === "repair"
                          ? "Sedang perbaikan"
                          : "Nonaktif"}
                    </span>
                  )}
                  {list.map((booking) => {
                    const style = {
                      left: `${pct(booking.startMinute)}%`,
                      width: `${pct(booking.endMinute) - pct(booking.startMinute)}%`,
                    };
                    const title = `${booking.topic}, ${formatClock(booking.startMinute)}–${formatClock(booking.endMinute)}, ${booking.departmentCode}, ${BOOKING_STATUS_LABEL[booking.status]}`;
                    const content = (
                      <>
                        <strong>{booking.topic}</strong>
                        <small>
                          {formatClock(booking.startMinute)}–
                          {formatClock(booking.endMinute)},{" "}
                          {booking.departmentCode}
                        </small>
                      </>
                    );
                    return canViewAll ||
                      booking.requesterId === currentUserId ? (
                      <Link
                        key={booking.id}
                        href={`/booking/${booking.id}?dari=beranda&tanggal=${date}`}
                        className={cx("slot", `s-${booking.status}`)}
                        style={style}
                        title={title}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div
                        key={booking.id}
                        className={cx("slot", `s-${booking.status}`)}
                        style={style}
                        title={title}
                      >
                        {content}
                      </div>
                    );
                  })}
                  {nowPos !== null && (
                    <i
                      className="now-line"
                      style={{ left: `${pct(nowPos)}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="legend">
        <span>
          <i className="l-approved" />
          Disetujui
        </span>
        <span>
          <i className="l-pic" />
          Menunggu PJ Ruang
        </span>
        <span>
          <i className="l-draft" />
          Draft
        </span>
        <span>
          <i className="l-done" />
          Selesai
        </span>
        {canBook && (
          <span className="legend-hint">
            Klik bagian kosong untuk langsung booking.
          </span>
        )}
      </div>
    </Card>
  );
}
