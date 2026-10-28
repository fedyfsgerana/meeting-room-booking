"use client";

import { useState, useTransition } from "react";
import { Plus, Users } from "lucide-react";
import { deleteUserAction, setUserActiveAction } from "@/backend/users/actions";
import type { UserRow } from "@/backend/users/queries";
import { Badge } from "@/frontend/components/ui/badge";
import { ButtonLink, IconLink } from "@/frontend/components/ui/button-link";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { DeleteDialog } from "@/frontend/components/ui/delete-dialog";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { PageHead } from "@/frontend/components/ui/page-head";
import { PersonCell } from "@/frontend/components/ui/person-cell";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

const COLUMNS: Column<UserRow>[] = [
  {
    key: "name",
    header: "Pengguna",
    render: (user) => (
      <PersonCell
        name={user.name}
        sub={user.email}
      />
    ),
    sortValue: (user) => user.name,
  },
  {
    key: "department",
    header: "Departemen",
    render: (user) => `${user.departmentName} (${user.departmentCode})`,
    sortValue: (user) => user.departmentName,
    className: "nowrap",
  },
  {
    key: "job",
    header: "Jabatan",
    render: (user) => user.job,
    sortValue: (user) => user.job,
  },
  {
    key: "access",
    header: "Akses",
    render: (user) => (
      <Badge tone="violet" dot={false}>
        {user.accessName}
      </Badge>
    ),
    sortValue: (user) => user.accessName,
  },
  {
    key: "status",
    header: "Status",
    render: (user) =>
      user.active ? (
        <Badge tone="ok">Aktif</Badge>
      ) : (
        <Badge tone="bad">Nonaktif</Badge>
      ),
    sortValue: (user) => (user.active ? 0 : 1),
  },
];

const FILTERS: TableFilter<UserRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  { value: "active", label: "Aktif", test: (user) => user.active },
  { value: "inactive", label: "Nonaktif", test: (user) => !user.active },
];

type UsersManagerProps = {
  users: UserRow[];
  currentUserId: number;
  can: {
    create: boolean;
    update: boolean;
    delete: boolean;
    resetPassword: boolean;
    deactivate: boolean;
  };
};

export function UsersManager({ users, currentUserId, can }: UsersManagerProps) {
  const notify = useStatus();
  const [target, setTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [reasonError, setReasonError] = useState<string>();

  const confirmToggle = () => {
    if (!target) return;
    const activate = !target.active;
    startTransition(async () => {
      const result = await setUserActiveAction(target.id, activate);
      setTarget(null);
      if (result.ok) notify(result.message ?? "Tersimpan.", "success");
      else notify(result.message ?? "Gagal menyimpan.", "error");
    });
  };

  const confirmDelete = (reason: string) => {
    if (!deleteTarget) return;
    const user = deleteTarget;
    startTransition(async () => {
      const result = await deleteUserAction(user.id, reason);
      if (!result.ok && result.fieldErrors?.reason) {
        setReasonError(result.fieldErrors.reason);
        return;
      }
      setDeleteTarget(null);
      notify(
        result.message ??
          (result.ok ? "Pengguna dihapus." : "Gagal menghapus."),
        result.ok ? "success" : "warning",
      );
    });
  };

  return (
    <>
      <PageHead
        title="Pengguna"
        description="Kelola akun yang bisa masuk ke Meeting Room Booking. Menu yang bisa dibuka mengikuti hak akses masing-masing."
        actions={
          can.create && (
            <ButtonLink
              href="/master/pengguna/tambah"
              variant="primary"
              icon={Plus}
            >
              Tambah pengguna
            </ButtonLink>
          )
        }
      />
      <DataTable
        id="users"
        rows={users}
        rowKey={(user) => user.id}
        columns={COLUMNS}
        unit="pengguna"
        searchPlaceholder="Cari nama, email, atau departemen"
        searchText={(user) =>
          [
            user.name,
            user.email,
            user.departmentName,
            user.departmentCode,
            user.job,
            user.accessName,
          ].join(" ")
        }
        filters={FILTERS}
        filterLabel="Filter status pengguna"
        initialSort={{ key: "name", dir: "asc" }}
        actions={(user) => {
          const self = user.id === currentUserId;
          return (
            <>
              {can.update && (
                <IconLink
                  href={`/master/pengguna/${user.id}`}
                  icon={ACTION_STYLE.update.icon}
                  label={`Ubah ${user.name}`}
                  tone={ACTION_STYLE.update.tone}
                />
              )}
              {can.resetPassword && (
                <IconLink
                  href={`/master/pengguna/${user.id}/password`}
                  icon={ACTION_STYLE.resetPassword.icon}
                  label={`Atur ulang password ${user.name}`}
                  tone={ACTION_STYLE.resetPassword.tone}
                />
              )}
              {can.deactivate && (
                <IconButton
                  icon={
                    user.active
                      ? ACTION_STYLE.deactivate.icon
                      : ACTION_STYLE.activate.icon
                  }
                  label={
                    self && user.active
                      ? "Akun sendiri tidak bisa dinonaktifkan"
                      : user.active
                        ? `Nonaktifkan ${user.name}`
                        : `Aktifkan ${user.name}`
                  }
                  tone={
                    user.active
                      ? ACTION_STYLE.deactivate.tone
                      : ACTION_STYLE.activate.tone
                  }
                  disabled={self && user.active}
                  onClick={() => setTarget(user)}
                />
              )}
              {can.delete && (
                <IconButton
                  icon={ACTION_STYLE.delete.icon}
                  label={
                    self
                      ? "Akun sendiri tidak bisa dihapus"
                      : user.inUse
                        ? `${user.name} punya riwayat booking, nonaktifkan saja`
                        : `Hapus ${user.name}`
                  }
                  tone={ACTION_STYLE.delete.tone}
                  disabled={self || user.inUse}
                  onClick={() => setDeleteTarget(user)}
                />
              )}
            </>
          );
        }}
        emptyIcon={Users}
        emptyTitle="Belum ada pengguna"
        emptyDescription="Tambahkan pengguna lewat tombol Tambah pengguna."
      />
      {target && (
        <ConfirmDialog
          title={target.active ? "Nonaktifkan pengguna?" : "Aktifkan pengguna?"}
          description={
            target.active
              ? `${target.name} tidak bisa masuk lagi dan langsung dikeluarkan dari semua sesinya. Booking yang sudah ada tidak terhapus.`
              : `${target.name} bisa masuk kembali dengan password yang sama.`
          }
          confirmLabel={target.active ? "Nonaktifkan" : "Aktifkan"}
          icon={
            target.active
              ? ACTION_STYLE.deactivate.icon
              : ACTION_STYLE.activate.icon
          }
          tone={
            target.active
              ? ACTION_STYLE.deactivate.modal
              : ACTION_STYLE.activate.modal
          }
          pending={pending}
          onConfirm={confirmToggle}
          onClose={() => setTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          title="Hapus pengguna?"
          description={`${deleteTarget.name} dihapus dari daftar pengguna dan tidak bisa masuk lagi.`}
          summary={[
            ["Email", deleteTarget.email],
            ["Departemen", deleteTarget.departmentCode],
          ]}
          confirmLabel="Hapus pengguna"
          pending={pending}
          error={reasonError}
          onConfirm={confirmDelete}
          onClose={() => {
            setReasonError(undefined);
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}
