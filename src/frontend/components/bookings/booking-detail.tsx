import Link from "next/link";
import { CalendarClock, History } from "lucide-react";
import type { BookingDetail } from "@/backend/bookings/queries";
import { Card, CardBody, CardHeader } from "@/frontend/components/ui/card";
import { BOOKING_EVENT_LABEL } from "@/lib/bookings";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { formatClock, formatDuration } from "@/lib/time";
import { StatusBadge } from "./status-badge";

export function BookingDetailView({ booking }: { booking: BookingDetail }) {
  const rows: Array<[string, string]> = [
    ["Ruang", `${booking.roomName} (${booking.roomCapacity} orang)`],
    ["Tanggal", formatLongDate(booking.date)],
    [
      "Waktu",
      `${formatClock(booking.startMinute)}–${formatClock(booking.endMinute)}, ${formatDuration(booking.endMinute - booking.startMinute)}`,
    ],
    ["Pemesan", booking.requesterName],
    ["Departemen", `${booking.departmentName} (${booking.departmentCode})`],
    ["Penyetuju", booking.approverName],
    [
      "Peserta",
      booking.participants ? `${booking.participants} orang` : "Belum diisi",
    ],
    [
      "Teleconference",
      booking.teleconference ? (booking.teleApp ?? "Ya") : "Tidak",
    ],
    ...(booking.teleconference
      ? ([
          [
            "Sebagai host",
            booking.host === null ? "-" : booking.host ? "Ya" : "Tidak",
          ],
          ["Lawan bicara", booking.counterpart ?? "-"],
        ] as [string, string][])
      : []),
    ["Catatan", booking.notes ?? "-"],
  ];
  if (booking.status === "draft" && booking.expiresAt)
    rows.push(["Batas persetujuan", formatDateTime(booking.expiresAt)]);
  if (booking.reason) rows.push(["Alasan", booking.reason]);

  return (
    <div className="detail-grid">
      <Card>
        <CardHeader
          title={booking.topic}
          actions={<StatusBadge status={booking.status} />}
        />
        <CardBody>
          <dl className="info-list">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {(booking.rescheduledFromId || booking.rescheduledToId) && (
            <div className="related-links">
              {booking.rescheduledFromId && (
                <Link
                  href={`/booking/${booking.rescheduledFromId}`}
                  className="link-icon"
                >
                  <History aria-hidden="true" />
                  Lihat jadwal sebelumnya
                </Link>
              )}
              {booking.rescheduledToId && (
                <Link
                  href={`/booking/${booking.rescheduledToId}`}
                  className="link-icon"
                >
                  <CalendarClock aria-hidden="true" />
                  Lihat jadwal baru
                </Link>
              )}
            </div>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Riwayat"
          description="Setiap perubahan status booking ini."
        />
        <CardBody>
          <ol className="timeline-list">
            {booking.events.map((event) => (
              <li key={event.id} className={`ev-${event.type}`}>
                <span className="dot" aria-hidden="true" />
                <div>
                  <div className="cell-main">
                    {BOOKING_EVENT_LABEL[event.type]}
                  </div>
                  <div className="cell-sub">
                    {event.actorName ?? "Sistem"},{" "}
                    {formatDateTime(event.createdAt)}
                  </div>
                  {event.note && <p className="ev-note">{event.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
