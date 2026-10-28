"use client";

import { useState } from "react";
import { CalendarX } from "lucide-react";
import type { BookingRow } from "@/backend/bookings/queries";
import { ButtonLink, IconLink } from "@/frontend/components/ui/button-link";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { PageHead } from "@/frontend/components/ui/page-head";
import { ACTIVE_STATUSES, BOOKING_STATUSES } from "@/lib/bookings";
import { formatShortDate } from "@/lib/format";
import { formatClock, formatDuration } from "@/lib/time";
import { CancelDialog } from "./cancel-dialog";
import { DraftCountdown } from "./draft-countdown";
import { StatusBadge } from "./status-badge";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type BookingsManagerProps = {
  bookings: BookingRow[];
  currentUserId: number;
  canManageAll: boolean;
  canCreate: boolean;
  canReschedule: boolean;
  canCancelOwn: boolean;
};

const isActive = (row: BookingRow) => ACTIVE_STATUSES.includes(row.status);

export function BookingsManager({
  bookings,
  currentUserId,
  canManageAll,
  canCreate,
  canReschedule,
  canCancelOwn,
}: BookingsManagerProps) {
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);

  const columns: Column<BookingRow>[] = [
    {
      key: "when",
      header: "Tanggal dan waktu",
      render: (row) => (
        <>
          <div className="cell-main nowrap">{formatShortDate(row.date)}</div>
          <div className="cell-sub nowrap">
            {formatClock(row.startMinute)}–{formatClock(row.endMinute)},{" "}
            {formatDuration(row.endMinute - row.startMinute)}
          </div>
        </>
      ),
      sortValue: (row) =>
        `${row.date} ${String(row.startMinute).padStart(4, "0")}`,
    },
    {
      key: "room",
      header: "Ruang",
      render: (row) => (
        <>
          <div className="cell-main">{row.roomName}</div>
          <div className="cell-sub">{row.roomCapacity} orang</div>
        </>
      ),
      sortValue: (row) => row.roomName,
    },
    {
      key: "topic",
      header: "Topik",
      render: (row) => (
        <>
          <div className="cell-main">{row.topic}</div>
          <div className="cell-sub">
            {row.participants
              ? `${row.participants} orang`
              : "Peserta belum diisi"}
            ,{" "}
            {row.teleconference
              ? (row.teleApp ?? "teleconference")
              : "tanpa teleconference"}
          </div>
        </>
      ),
      sortValue: (row) => row.topic,
    },
    ...(canManageAll
      ? [
          {
            key: "requester",
            header: "Pemesan",
            render: (row: BookingRow) => (
              <>
                <div className="cell-main">{row.requesterName}</div>
                <div className="cell-sub">{row.departmentName}</div>
              </>
            ),
            sortValue: (row: BookingRow) => row.requesterName,
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <>
          <StatusBadge status={row.status} />
          {row.status === "draft" && row.expiresAt && (
            <DraftCountdown expiresAt={row.expiresAt} />
          )}
        </>
      ),
      sortValue: (row) => BOOKING_STATUSES.indexOf(row.status),
    },
  ];

  const filters: TableFilter<BookingRow>[] = [
    { value: "upcoming", label: "Akan datang", test: isActive },
    { value: "history", label: "Riwayat", test: (row) => !isActive(row) },
    { value: "all", label: "Semua", test: () => true },
  ];

  return (
    <>
      <PageHead
        title="Booking Ruang"
        description="Ajukan booking ruang meeting dan pantau statusnya. Draft yang belum disetujui sampai batas waktunya batal otomatis."
        actions={
          canCreate && (
            <ButtonLink
              href="/booking/baru"
              variant="primary"
              icon={ACTION_STYLE.book.icon}
            >
              Booking ruang
            </ButtonLink>
          )
        }
      />
      <DataTable
        id="bookings"
        rows={bookings}
        rowKey={(row) => row.id}
        columns={columns}
        unit="booking"
        searchPlaceholder="Cari topik, ruang, pemesan, atau departemen"
        searchText={(row) =>
          [
            row.topic,
            row.roomName,
            row.requesterName,
            row.departmentName,
            row.departmentCode,
          ].join(" ")
        }
        filters={filters}
        filterLabel="Filter booking"
        initialSort={{ key: "when", dir: "asc" }}
        actions={(row) => {
          const owner = row.requesterId === currentUserId;
          const active = isActive(row);
          return (
            <>
              <IconLink
                href={`/booking/${row.id}`}
                icon={ACTION_STYLE.view.icon}
                tone={ACTION_STYLE.view.tone}
                label={`Detail ${row.topic}`}
              />
              {owner && active && canReschedule && (
                <IconLink
                  href={`/booking/${row.id}/jadwal-ulang`}
                  icon={ACTION_STYLE.reschedule.icon}
                  label="Jadwalkan ulang"
                  tone={ACTION_STYLE.reschedule.tone}
                />
              )}
              {((owner && canCancelOwn) || canManageAll) && active && (
                <IconButton
                  icon={ACTION_STYLE.cancel.icon}
                  label="Batalkan"
                  tone={ACTION_STYLE.cancel.tone}
                  onClick={() => setCancelTarget(row)}
                />
              )}
            </>
          );
        }}
        emptyIcon={CalendarX}
        emptyTitle="Belum ada booking"
        emptyDescription={
          canCreate
            ? "Tekan Booking ruang untuk mengajukan booking pertama."
            : "Belum ada booking yang bisa ditampilkan."
        }
      />
      {cancelTarget && (
        <CancelDialog
          bookingId={cancelTarget.id}
          summary={`${cancelTarget.topic} di ${cancelTarget.roomName}, ${formatShortDate(cancelTarget.date)} ${formatClock(cancelTarget.startMinute)}–${formatClock(cancelTarget.endMinute)}`}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}
