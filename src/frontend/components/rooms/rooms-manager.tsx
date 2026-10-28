"use client";

import { useState, useTransition } from "react";
import { DoorOpen, Plus } from "lucide-react";
import { deleteRoomAction } from "@/backend/rooms/actions";
import type { RoomRow } from "@/backend/rooms/queries";
import { Badge, type BadgeTone } from "@/frontend/components/ui/badge";
import { ButtonLink, IconLink } from "@/frontend/components/ui/button-link";
import { DeleteDialog } from "@/frontend/components/ui/delete-dialog";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { PageHead } from "@/frontend/components/ui/page-head";
import { useStatus } from "@/frontend/components/ui/status-modal";
import {
  ROOM_STATUSES,
  ROOM_STATUS_LABEL,
  facilityLabel,
  type RoomStatus,
} from "@/lib/rooms";
import { RoomCell } from "./room-cell";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

const STATUS_TONE: Record<RoomStatus, BadgeTone> = {
  active: "ok",
  repair: "warn",
  off: "bad",
};

const COLUMNS: Column<RoomRow>[] = [
  {
    key: "name",
    header: "Ruang",
    render: (room) => <RoomCell name={room.name} capacity={room.capacity} />,
    sortValue: (room) => room.name,
  },
  {
    key: "location",
    header: "Lokasi",
    render: (room) => room.location,
    sortValue: (room) => room.location,
    className: "nowrap",
  },
  {
    key: "department",
    header: "Departemen",
    render: (room) =>
      room.departmentCode ?? <span className="cell-muted">Belum diisi</span>,
    sortValue: (room) => room.departmentCode ?? "\uffff",
  },
  {
    key: "facilities",
    header: "Fasilitas",
    render: (room) => (
      <div className="tags">
        {room.facilities.length ? (
          room.facilities.map((key) => (
            <Badge key={key} tone="info" dot={false}>
              {facilityLabel(key)}
            </Badge>
          ))
        ) : (
          <Badge dot={false}>Belum ada</Badge>
        )}
      </div>
    ),
    sortValue: (room) => room.facilities.length,
  },
  {
    key: "pic",
    header: "Penanggung Jawab Ruang",
    render: (room) =>
      room.picName ?? <Badge dot={false}>Belum ditetapkan</Badge>,
    sortValue: (room) => room.picName,
  },
  {
    key: "status",
    header: "Status",
    render: (room) => (
      <Badge tone={STATUS_TONE[room.status]}>
        {ROOM_STATUS_LABEL[room.status]}
      </Badge>
    ),
    sortValue: (room) => ROOM_STATUSES.indexOf(room.status),
  },
];

const FILTERS: TableFilter<RoomRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  ...ROOM_STATUSES.map((status) => ({
    value: status,
    label: ROOM_STATUS_LABEL[status],
    test: (room: RoomRow) => room.status === status,
  })),
];

type RoomsManagerProps = {
  rooms: RoomRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function RoomsManager({
  rooms,
  canCreate,
  canUpdate,
  canDelete,
}: RoomsManagerProps) {
  const notify = useStatus();
  const [target, setTarget] = useState<RoomRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [reasonError, setReasonError] = useState<string>();

  const confirmDelete = (reason: string) => {
    if (!target) return;
    const room = target;
    startTransition(async () => {
      const result = await deleteRoomAction(room.id, reason);
      if (!result.ok && result.fieldErrors?.reason) {
        setReasonError(result.fieldErrors.reason);
        return;
      }
      setTarget(null);
      notify(
        result.message ?? (result.ok ? "Ruangan dihapus." : "Gagal menghapus."),
        result.ok ? "success" : "warning",
      );
    });
  };

  return (
    <>
      <PageHead
        title="Ruangan"
        description="Daftar ruang meeting beserta kapasitas, fasilitas, dan statusnya. Ruang berstatus Perbaikan atau Nonaktif tidak bisa dipesan."
        actions={
          canCreate && (
            <ButtonLink
              href="/master/ruangan/tambah"
              variant="primary"
              icon={Plus}
            >
              Tambah ruangan
            </ButtonLink>
          )
        }
      />
      <DataTable
        id="rooms"
        rows={rooms}
        rowKey={(room) => room.id}
        columns={COLUMNS}
        unit="ruang"
        searchPlaceholder="Cari nama ruang, lokasi, atau fasilitas"
        searchText={(room) =>
          [
            room.name,
            room.location,
            room.departmentName ?? "",
            room.departmentCode ?? "",
            room.picName ?? "",
            ...room.facilities.map(facilityLabel),
          ].join(" ")
        }
        filters={FILTERS}
        filterLabel="Filter status ruang"
        actions={(room) => (
          <>
            {canUpdate && (
              <IconLink
                href={`/master/ruangan/${room.id}`}
                icon={ACTION_STYLE.update.icon}
                label={`Ubah ${room.name}`}
                tone={ACTION_STYLE.update.tone}
              />
            )}
            {canDelete && (
              <IconButton
                icon={ACTION_STYLE.delete.icon}
                label={
                  room.inUse
                    ? `${room.name} punya riwayat booking, tidak bisa dihapus`
                    : `Hapus ${room.name}`
                }
                tone={ACTION_STYLE.delete.tone}
                disabled={room.inUse}
                onClick={() => setTarget(room)}
              />
            )}
          </>
        )}
        emptyIcon={DoorOpen}
        emptyTitle="Belum ada ruangan"
        emptyDescription="Tambahkan ruang meeting pertama lewat tombol Tambah ruangan."
      />
      {target && (
        <DeleteDialog
          title="Hapus ruangan?"
          description={`${target.name} dihapus dari daftar ruangan dan tidak bisa dipesan lagi.`}
          summary={[
            ["Lokasi", target.location],
            ["Kapasitas", `${target.capacity} orang`],
          ]}
          confirmLabel="Hapus ruangan"
          pending={pending}
          error={reasonError}
          onConfirm={confirmDelete}
          onClose={() => {
            setReasonError(undefined);
            setTarget(null);
          }}
        />
      )}
    </>
  );
}
