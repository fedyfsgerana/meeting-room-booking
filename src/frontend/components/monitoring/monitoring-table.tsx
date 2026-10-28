"use client";

import type { ReactNode } from "react";
import { DoorOpen, Eye } from "lucide-react";
import { Badge, type BadgeTone } from "@/frontend/components/ui/badge";
import { IconLink } from "@/frontend/components/ui/button-link";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { formatDuration } from "@/lib/time";

export type MonitoringRow = {
  id: number;
  name: string;
  department: string | null;
  capacity: number;
  active: boolean;
  drafts: number;
  count: number;
  minutes: number;
  occupancy: number;
  stateLabel: string;
  stateTone: BadgeTone;
  next: string;
};

const COLUMNS: Column<MonitoringRow>[] = [
  {
    key: "name",
    header: "Ruang",
    render: (row) => (
      <>
        <div className="cell-main">{row.name}</div>
        <div className="cell-sub">{row.capacity} orang</div>
      </>
    ),
    sortValue: (row) => row.name,
  },
  {
    key: "department",
    header: "Departemen",
    render: (row) => row.department ?? "-",
    sortValue: (row) => row.department ?? "",
  },
  {
    key: "count",
    header: "Jumlah booking",
    render: (row) => <span className="mono">{row.count} booking</span>,
    sortValue: (row) => row.count,
    className: "nowrap",
  },
  {
    key: "minutes",
    header: "Total pemakaian",
    render: (row) => (row.minutes ? formatDuration(row.minutes) : "-"),
    sortValue: (row) => row.minutes,
    className: "nowrap",
  },
  {
    key: "occupancy",
    header: "Tingkat pemakaian",
    render: (row) => (
      <div className="occ">
        <span className="occ-bar">
          <i style={{ width: `${Math.min(100, row.occupancy)}%` }} />
        </span>
        <span className="mono">{row.occupancy}%</span>
      </div>
    ),
    sortValue: (row) => row.occupancy,
  },
  {
    key: "state",
    header: "Status",
    render: (row) => (
      <div className="badge-row">
        <Badge tone={row.stateTone}>{row.stateLabel}</Badge>
        {row.drafts > 0 && <Badge tone="warn">{row.drafts} Draft</Badge>}
      </div>
    ),
    sortValue: (row) => row.stateLabel,
  },
  {
    key: "next",
    header: "Keterangan",
    render: (row) => <span className="cell-sub">{row.next}</span>,
  },
];

const FILTERS: TableFilter<MonitoringRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  { value: "used", label: "Ada booking", test: (row) => row.count > 0 },
  {
    value: "empty",
    label: "Kosong",
    test: (row) => row.active && row.count === 0,
  },
];

export function MonitoringTable({
  rows,
  nav,
  date,
}: {
  rows: MonitoringRow[];
  nav: ReactNode;
  date: string;
}) {
  return (
    <DataTable
      id="monitoring"
      rows={rows}
      rowKey={(row) => row.id}
      columns={COLUMNS}
      unit="ruang"
      searchPlaceholder="Cari nama ruang atau departemen"
      searchText={(row) => [row.name, row.department ?? ""].join(" ")}
      filters={FILTERS}
      filterLabel="Filter pemakaian"
      toolbarExtra={nav}
      actions={(row) => (
        <IconLink
          href={`/monitoring/${row.id}?tanggal=${date}`}
          icon={Eye}
          label={`Lihat pemakaian ${row.name}`}
        />
      )}
      emptyIcon={DoorOpen}
      emptyTitle="Belum ada ruangan"
      emptyDescription="Hubungi administrator untuk menambahkan ruangan."
    />
  );
}
