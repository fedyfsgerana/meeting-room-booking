"use client";

import type { ReactNode } from "react";
import { CalendarX, Eye } from "lucide-react";
import type { ScheduleBooking } from "@/backend/dashboard/queries";
import { DraftCountdown } from "@/frontend/components/bookings/draft-countdown";
import { StatusBadge } from "@/frontend/components/bookings/status-badge";
import { IconLink } from "@/frontend/components/ui/button-link";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { formatClock } from "@/lib/time";

export type UsageRow = ScheduleBooking & { viewable: boolean };

const COLUMNS: Column<UsageRow>[] = [
  {
    key: "time",
    header: "Jam",
    render: (row) => (
      <span className="mono">
        {formatClock(row.startMinute)}–{formatClock(row.endMinute)}
      </span>
    ),
    sortValue: (row) => row.startMinute,
    className: "nowrap",
  },
  {
    key: "topic",
    header: "Topik",
    render: (row) => (
      <>
        <div className="cell-main">{row.topic}</div>
        <div className="cell-sub">{row.requesterName}</div>
      </>
    ),
    sortValue: (row) => row.topic,
  },
  {
    key: "department",
    header: "Departemen",
    render: (row) => (
      <>
        <div className="cell-main">{row.departmentCode}</div>
        <div className="cell-sub">{row.approverName}</div>
      </>
    ),
    sortValue: (row) => row.departmentCode,
  },
  {
    key: "participants",
    header: "Peserta",
    render: (row) => (row.participants ? `${row.participants} orang` : "-"),
    sortValue: (row) => row.participants ?? 0,
    className: "nowrap",
  },
  {
    key: "tele",
    header: "Teleconference",
    render: (row) =>
      row.teleconference ? (
        <>
          <div className="cell-main">{row.teleApp ?? "Ya"}</div>
          <div className="cell-sub">
            {row.host === null ? "-" : row.host ? "Sebagai host" : "Bukan host"}
          </div>
        </>
      ) : (
        <span className="cell-muted">Tidak</span>
      ),
    sortValue: (row) => (row.teleconference ? (row.teleApp ?? "Ya") : ""),
  },
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
    sortValue: (row) => row.status,
  },
];

const FILTERS: TableFilter<UsageRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  {
    value: "approved",
    label: "Disetujui",
    test: (row) => row.status === "approved" || row.status === "done",
  },
  {
    value: "pending",
    label: "Menunggu",
    test: (row) => row.status === "draft" || row.status === "pic",
  },
];

type RoomUsageTableProps = {
  rows: UsageRow[];
  roomId: number;
  date: string;
  nav: ReactNode;
};

export function RoomUsageTable({
  rows,
  roomId,
  date,
  nav,
}: RoomUsageTableProps) {
  return (
    <DataTable
      id={`room-usage-${roomId}`}
      rows={rows}
      rowKey={(row) => row.id}
      columns={COLUMNS}
      unit="booking"
      searchPlaceholder="Cari topik, pemesan, departemen, atau penyetuju"
      searchText={(row) =>
        [
          row.topic,
          row.requesterName,
          row.departmentCode,
          row.approverName,
          row.teleApp ?? "",
        ].join(" ")
      }
      filters={FILTERS}
      filterLabel="Filter status"
      toolbarExtra={nav}
      actions={(row) =>
        row.viewable ? (
          <IconLink
            href={`/booking/${row.id}?dari=monitoring&ruang=${roomId}&tanggal=${date}`}
            icon={Eye}
            label={`Detail ${row.topic}`}
          />
        ) : null
      }
      emptyIcon={CalendarX}
      emptyTitle="Belum ada booking"
      emptyDescription="Ruang ini belum dipesan pada tanggal tersebut."
    />
  );
}
