"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import {
  approveDeptAction,
  checkPicAction,
} from "@/backend/approvals/actions";
import type { BookingRow } from "@/backend/bookings/queries";
import { DraftCountdown } from "@/frontend/components/bookings/draft-countdown";
import { StatusBadge } from "@/frontend/components/bookings/status-badge";
import { IconLink } from "@/frontend/components/ui/button-link";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/frontend/components/ui/data-table";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { useStatus } from "@/frontend/components/ui/status-modal";
import type { ActionResult } from "@/lib/action-result";
import type { ApprovalMode } from "@/lib/approvals";
import { formatShortDate } from "@/lib/format";
import { formatClock, formatDuration } from "@/lib/time";
import { RejectDialog } from "./reject-dialog";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type PositiveAction = {
  label: string;
  title: string;
  description: (row: BookingRow) => string;
  icon: LucideIcon;
  run: (id: number) => Promise<ActionResult>;
};

const POSITIVE: Record<ApprovalMode, PositiveAction> = {
  approver: {
    label: "Setujui",
    title: "Setujui booking?",
    description: (row) =>
      `${row.topic} oleh ${row.requesterName}. Booking diteruskan ke Penanggung Jawab Ruang untuk cek kesiapan ruang.`,
    icon: ACTION_STYLE.approve.icon,
    run: approveDeptAction,
  },
  pic: {
    label: "Ruang siap",
    title: "Ruang dan perlengkapan siap?",
    description: (row) =>
      `${row.roomName} untuk ${row.topic}. Booking menjadi Disetujui dan ruang dipakai sesuai jadwal.`,
    icon: ACTION_STYLE.check.icon,
    run: checkPicAction,
  },
};

const summaryOf = (row: BookingRow) =>
  `${row.topic} di ${row.roomName}, ${formatShortDate(row.date)} ${formatClock(row.startMinute)}–${formatClock(row.endMinute)}`;

const COLUMNS: Column<BookingRow>[] = [
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
  {
    key: "requester",
    header: "Pemesan",
    render: (row) => (
      <>
        <div className="cell-main">{row.requesterName}</div>
        <div className="cell-sub">{row.departmentName}</div>
      </>
    ),
    sortValue: (row) => row.requesterName,
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
  },
];

type Dialog = { kind: "positive" | "reject"; row: BookingRow } | null;

type ApprovalsManagerProps = {
  mode: ApprovalMode;
  rows: BookingRow[];
  tabs?: ReactNode;
  canApprove: boolean;
  canReject: boolean;
};

export function ApprovalsManager({
  mode,
  rows,
  tabs,
  canApprove,
  canReject,
}: ApprovalsManagerProps) {
  const notify = useStatus();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, startTransition] = useTransition();
  const positive = POSITIVE[mode];

  const confirmPositive = () => {
    if (dialog?.kind !== "positive") return;
    const target = dialog.row;
    startTransition(async () => {
      const result = await positive.run(target.id);
      setDialog(null);
      notify(
        result.message ?? (result.ok ? "Tersimpan." : "Gagal menyimpan."),
        result.ok ? "success" : "warning",
      );
    });
  };

  return (
    <>
      <DataTable
        key={mode}
        id={`approvals-${mode}`}
        rows={rows}
        rowKey={(row) => row.id}
        columns={COLUMNS}
        unit="booking"
        searchPlaceholder="Cari topik, ruang, atau pemesan"
        searchText={(row) =>
          [row.topic, row.roomName, row.requesterName, row.departmentName].join(
            " ",
          )
        }
        initialSort={{ key: "when", dir: "asc" }}
        toolbarExtra={tabs}
        actions={(row) => (
          <>
            <IconLink
              href={`/booking/${row.id}?dari=persetujuan&tahap=${mode}`}
              icon={ACTION_STYLE.view.icon}
              tone={ACTION_STYLE.view.tone}
              label={`Detail ${row.topic}`}
            />
            {canReject && (
              <IconButton
                icon={ACTION_STYLE.reject.icon}
                label="Tolak"
                tone={ACTION_STYLE.reject.tone}
                onClick={() => setDialog({ kind: "reject", row })}
              />
            )}
            {canApprove && (
              <IconButton
                icon={positive.icon}
                label={positive.label}
                tone={ACTION_STYLE.approve.tone}
                onClick={() => setDialog({ kind: "positive", row })}
              />
            )}
          </>
        )}
        emptyIcon={Inbox}
        emptyTitle="Tidak ada antrean"
        emptyDescription="Semua booking pada tahap ini sudah ditindaklanjuti."
      />
      {dialog?.kind === "positive" && (
        <ConfirmDialog
          title={positive.title}
          description={positive.description(dialog.row)}
          confirmLabel={positive.label}
          icon={positive.icon}
          tone={ACTION_STYLE.approve.modal}
          summary={[
            ["Ruang", dialog.row.roomName],
            [
              "Jadwal",
              `${formatShortDate(dialog.row.date)} · ${formatClock(dialog.row.startMinute)}–${formatClock(dialog.row.endMinute)}`,
            ],
            [
              "Pemesan",
              `${dialog.row.requesterName} · ${dialog.row.departmentCode}`,
            ],
          ]}
          pending={pending}
          onConfirm={confirmPositive}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "reject" && (
        <RejectDialog
          bookingId={dialog.row.id}
          summary={summaryOf(dialog.row)}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
