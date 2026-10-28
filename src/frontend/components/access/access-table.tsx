"use client";

import { useState, useTransition } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { deleteAccessGroupAction } from "@/backend/access/actions";
import type { AccessGroupRow } from "@/backend/access/queries";
import { Badge } from "@/frontend/components/ui/badge";
import { IconLink } from "@/frontend/components/ui/button-link";
import { DeleteDialog } from "@/frontend/components/ui/delete-dialog";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { ALL_PERMISSIONS, PERMISSION_MENUS } from "@/lib/permissions";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

function menusOf(permissions: string[]) {
  return PERMISSION_MENUS.filter((menu) =>
    permissions.includes(`${menu.key}.view`),
  ).map((menu) => ({
    key: menu.key,
    label: menu.label,
    actions: menu.actions.filter((action) =>
      permissions.includes(`${menu.key}.${action.key}`),
    ).length,
    total: menu.actions.length,
  }));
}

const COLUMNS: Column<AccessGroupRow>[] = [
  {
    key: "name",
    header: "Hak akses",
    render: (group) => (
      <div>
        <div className="cell-main">{group.name}</div>
        <div className="cell-sub cell-wrap">
          {group.description || "Tanpa deskripsi"}
        </div>
      </div>
    ),
    sortValue: (group) => group.name,
  },
  {
    key: "permissions",
    header: "Menu",
    render: (group) => (
      <div className="tags">
        {group.permissions.length === ALL_PERMISSIONS.length ? (
          <Badge tone="info" dot={false}>
            Semua menu dan aksi
          </Badge>
        ) : menusOf(group.permissions).length ? (
          menusOf(group.permissions).map((menu) => (
            <Badge key={menu.key} tone="info" dot={false}>
              {menu.label}
              {menu.actions < menu.total
                ? ` · ${menu.actions}/${menu.total}`
                : ""}
            </Badge>
          ))
        ) : (
          <Badge dot={false}>Belum ada</Badge>
        )}
      </div>
    ),
    sortValue: (group) => group.permissions.length,
  },
  {
    key: "users",
    header: "Pengguna aktif",
    render: (group) => <span className="mono">{group.userCount} orang</span>,
    sortValue: (group) => group.userCount,
    className: "nowrap",
  },
  {
    key: "status",
    header: "Status",
    render: (group) =>
      group.locked ? (
        <Badge tone="gray">Terkunci</Badge>
      ) : (
        <Badge tone="ok">Bisa diubah</Badge>
      ),
    sortValue: (group) => (group.locked ? 1 : 0),
  },
];

const FILTERS: TableFilter<AccessGroupRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  { value: "editable", label: "Bisa diubah", test: (group) => !group.locked },
  { value: "locked", label: "Terkunci", test: (group) => group.locked },
];

export function AccessTable({
  groups,
  canUpdate,
  canDelete,
}: {
  groups: AccessGroupRow[];
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const notify = useStatus();
  const [target, setTarget] = useState<AccessGroupRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [reasonError, setReasonError] = useState<string>();

  const confirmDelete = (reason: string) => {
    if (!target) return;
    const group = target;
    startTransition(async () => {
      const result = await deleteAccessGroupAction(group.id, reason);
      if (!result.ok && result.fieldErrors?.reason) {
        setReasonError(result.fieldErrors.reason);
        return;
      }
      setTarget(null);
      notify(
        result.message ??
          (result.ok ? "Hak akses dihapus." : "Gagal menghapus."),
        result.ok ? "success" : "warning",
      );
    });
  };

  return (
    <>
      <DataTable
        id="access"
        rows={groups}
        rowKey={(group) => group.id}
        columns={COLUMNS}
        unit="hak akses"
        searchPlaceholder="Cari nama hak akses atau menu"
        searchText={(group) =>
          [
            group.name,
            group.description,
            ...menusOf(group.permissions).map((menu) => menu.label),
          ].join(" ")
        }
        filters={FILTERS}
        filterLabel="Filter hak akses"
        actions={(group) =>
          group.locked ? (
            <IconButton icon={Lock} label={`${group.name} terkunci`} disabled />
          ) : (
            <>
              {canUpdate ? (
                <IconLink
                  href={`/master/hak-akses/${group.id}`}
                  icon={ACTION_STYLE.update.icon}
                  label={`Ubah hak akses ${group.name}`}
                  tone={ACTION_STYLE.update.tone}
                />
              ) : (
                <IconLink
                  href={`/master/hak-akses/${group.id}`}
                  icon={ACTION_STYLE.view.icon}
                  tone={ACTION_STYLE.view.tone}
                  label={`Lihat hak akses ${group.name}`}
                />
              )}
              {canDelete && (
                <IconButton
                  icon={ACTION_STYLE.delete.icon}
                  label={
                    group.userCount
                      ? `${group.name} masih dipakai ${group.userCount} pengguna`
                      : `Hapus ${group.name}`
                  }
                  tone={ACTION_STYLE.delete.tone}
                  disabled={group.userCount > 0}
                  onClick={() => setTarget(group)}
                />
              )}
            </>
          )
        }
        emptyIcon={ShieldCheck}
        emptyTitle="Belum ada hak akses"
        emptyDescription="Tambahkan lewat tombol Tambah hak akses."
      />
      {target && (
        <DeleteDialog
          title="Hapus hak akses?"
          description={`${target.name} dihapus dari daftar hak akses.`}
          summary={[
            ["Deskripsi", target.description || "-"],
            ["Menu dan aksi", `${target.permissions.length} aksi`],
          ]}
          confirmLabel="Hapus hak akses"
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
