"use client";

import { useState } from "react";
import { History } from "lucide-react";
import type { ActivityRow } from "@/backend/activity/queries";
import { Badge } from "@/frontend/components/ui/badge";
import { IconButton } from "@/frontend/components/ui/icon-button";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import {
  ACTIVITY_ACTION_LABEL,
  ACTIVITY_ACTION_TONE,
  ACTIVITY_MODULE_LABEL,
  RESTORABLE_MODULES,
  deviceLabel,
} from "@/lib/activity";
import { ActivityDetailDialog } from "./activity-detail-dialog";

import { formatDateTime } from "@/lib/format";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

const AUTH_ACTIONS = new Set(["login", "logout", "login_failed"]);

const FILTERS: TableFilter<ActivityRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  {
    value: "change",
    label: "Perubahan data",
    test: (row) => !AUTH_ACTIONS.has(row.action),
  },
  {
    value: "auth",
    label: "Login dan sesi",
    test: (row) => AUTH_ACTIONS.has(row.action),
  },
  {
    value: "failed",
    label: "Login gagal",
    test: (row) => row.action === "login_failed",
  },
];

const COLUMNS: Column<ActivityRow>[] = [
  {
    key: "time",
    header: "Waktu",
    render: (row) => formatDateTime(row.createdAt),
    sortValue: (row) => new Date(row.createdAt).getTime(),
    className: "nowrap",
  },
  {
    key: "actor",
    header: "Pengguna",
    render: (row) =>
      row.actorName ?? <span className="cell-muted">Tidak dikenal</span>,
    sortValue: (row) => row.actorName ?? "\uffff",
  },
  {
    key: "action",
    header: "Aksi",
    render: (row) => (
      <Badge tone={ACTIVITY_ACTION_TONE[row.action]}>
        {ACTIVITY_ACTION_LABEL[row.action]}
      </Badge>
    ),
    sortValue: (row) => ACTIVITY_ACTION_LABEL[row.action],
  },
  {
    key: "module",
    header: "Modul",
    render: (row) => ACTIVITY_MODULE_LABEL[row.module],
    sortValue: (row) => ACTIVITY_MODULE_LABEL[row.module],
    className: "nowrap",
  },
  {
    key: "target",
    header: "Data",
    render: (row) => (
      <>
        <div className="cell-main">{row.targetLabel ?? "-"}</div>
        {row.detail && <div className="cell-sub">{row.detail}</div>}
      </>
    ),
    sortValue: (row) => row.targetLabel ?? "",
  },
  {
    key: "device",
    header: "Perangkat",
    render: (row) => (
      <>
        <div className="cell-main nowrap">{deviceLabel(row.userAgent)}</div>
        <div className="cell-sub nowrap">{row.ipAddress ?? "-"}</div>
      </>
    ),
    sortValue: (row) => row.ipAddress ?? "",
  },
];

export function ActivityTable({
  rows,
  canRestore,
}: {
  rows: ActivityRow[];
  canRestore: boolean;
}) {
  const [opened, setOpened] = useState<number | null>(null);

  return (
    <>
      <DataTable
        id="activity"
        rows={rows}
        rowKey={(row) => row.id}
        columns={COLUMNS}
        unit="aktivitas"
        searchPlaceholder="Cari pengguna, data, atau alamat IP"
        searchText={(row) =>
          [
            row.actorName ?? "",
            row.targetLabel ?? "",
            row.detail ?? "",
            row.ipAddress ?? "",
            ACTIVITY_MODULE_LABEL[row.module],
          ].join(" ")
        }
        filters={FILTERS}
        filterLabel="Filter aktivitas"
        actions={(row) =>
          canRestore &&
          row.hasSnapshot &&
          RESTORABLE_MODULES.has(row.module) ? (
            <IconButton
              icon={ACTION_STYLE.restore.icon}
              label={
                row.action === "delete"
                  ? "Lihat dan kembalikan data"
                  : "Lihat perubahan dan kembalikan"
              }
              tone={ACTION_STYLE.restore.tone}
              onClick={() => setOpened(row.id)}
            />
          ) : (
            <IconButton
              icon={ACTION_STYLE.view.icon}
              label="Lihat detail"
              tone={ACTION_STYLE.view.tone}
              onClick={() => setOpened(row.id)}
            />
          )
        }
        emptyIcon={History}
        emptyTitle="Belum ada aktivitas"
        emptyDescription="Tidak ada aktivitas pada rentang tanggal ini."
      />
      {opened !== null && (
        <ActivityDetailDialog
          key={opened}
          id={opened}
          canRestore={canRestore}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
