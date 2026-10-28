"use client";

import { useState, useTransition } from "react";
import { Building2 } from "lucide-react";
import { deleteDepartmentAction } from "@/backend/departments/crud-actions";
import type { DepartmentRow } from "@/backend/departments/queries";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";
import { Badge } from "@/frontend/components/ui/badge";
import { ButtonLink, IconLink } from "@/frontend/components/ui/button-link";
import { DataTable, type Column, type TableFilter } from "@/frontend/components/ui/data-table";
import { DeleteDialog } from "@/frontend/components/ui/delete-dialog";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { PageHead } from "@/frontend/components/ui/page-head";
import { useStatus } from "@/frontend/components/ui/status-modal";

const COLUMNS: Column<DepartmentRow>[] = [
  {
    key: "name",
    header: "Departemen",
    render: (row) => (
      <>
        <div className="cell-main">{row.name}</div>
        <div className="cell-sub">{row.code}</div>
      </>
    ),
    sortValue: (row) => row.name,
  },
  {
    key: "users",
    header: "Pengguna",
    render: (row) => `${row.userCount} orang`,
    sortValue: (row) => row.userCount,
    className: "nowrap",
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (row.active ? <Badge tone="ok">Aktif</Badge> : <Badge tone="bad">Nonaktif</Badge>),
    sortValue: (row) => (row.active ? 0 : 1),
  },
];

const FILTERS: TableFilter<DepartmentRow>[] = [
  { value: "all", label: "Semua", test: () => true },
  { value: "active", label: "Aktif", test: (row) => row.active },
  { value: "inactive", label: "Nonaktif", test: (row) => !row.active },
];

type DepartmentsManagerProps = {
  departments: DepartmentRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function DepartmentsManager({ departments, canCreate, canUpdate, canDelete }: DepartmentsManagerProps) {
  const notify = useStatus();
  const [target, setTarget] = useState<DepartmentRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [reasonError, setReasonError] = useState<string>();

  const confirmDelete = (reason: string) => {
    if (!target) return;
    const department = target;
    startTransition(async () => {
      const result = await deleteDepartmentAction(department.id, reason);
      if (!result.ok && result.fieldErrors?.reason) {
        setReasonError(result.fieldErrors.reason);
        return;
      }
      setTarget(null);
      setReasonError(undefined);
      notify(result.message ?? (result.ok ? "Departemen dihapus." : "Gagal menghapus."), result.ok ? "success" : "warning");
    });
  };

  return (
    <>
      <PageHead
        title="Departemen"
        description="Daftar departemen untuk pengguna, ruangan, dan penyetuju. Departemen nonaktif tidak muncul di pilihan form."
        actions={
          canCreate && (
            <ButtonLink href="/master/departemen/tambah" variant="primary" icon={ACTION_STYLE.create.icon}>
              Tambah departemen
            </ButtonLink>
          )
        }
      />
      <DataTable
        id="departments"
        rows={departments}
        rowKey={(row) => row.id}
        columns={COLUMNS}
        unit="departemen"
        searchPlaceholder="Cari nama atau kode departemen"
        searchText={(row) => `${row.name} ${row.code}`}
        filters={FILTERS}
        filterLabel="Filter status departemen"
        actions={(row) => (
          <>
            {canUpdate && (
              <IconLink
                href={`/master/departemen/${row.id}`}
                icon={ACTION_STYLE.update.icon}
                label={`Ubah ${row.name}`}
                tone={ACTION_STYLE.update.tone}
              />
            )}
            {canDelete && (
              <IconButton
                icon={ACTION_STYLE.delete.icon}
                label={row.inUse ? `${row.name} masih dipakai, nonaktifkan saja` : `Hapus ${row.name}`}
                tone={ACTION_STYLE.delete.tone}
                disabled={row.inUse}
                onClick={() => setTarget(row)}
              />
            )}
          </>
        )}
        emptyIcon={Building2}
        emptyTitle="Belum ada departemen"
        emptyDescription="Tambahkan lewat tombol Tambah departemen."
      />
      {target && (
        <DeleteDialog
          title="Hapus departemen?"
          description={`${target.name} dihapus dari daftar departemen.`}
          summary={[["Kode", target.code]]}
          confirmLabel="Hapus departemen"
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
