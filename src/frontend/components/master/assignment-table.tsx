"use client";

import { useState, useTransition } from "react";
import { UserCheck } from "lucide-react";
import { removeApproverAction } from "@/backend/departments/actions";
import { removePicAction } from "@/backend/rooms/actions";
import { Badge } from "@/frontend/components/ui/badge";
import { IconLink } from "@/frontend/components/ui/button-link";
import { DeleteDialog } from "@/frontend/components/ui/delete-dialog";
import {
  DataTable,
  type Column,
  type TableFilter,
} from "@/frontend/components/ui/data-table";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { PersonCell } from "@/frontend/components/ui/person-cell";
import { useStatus } from "@/frontend/components/ui/status-modal";
import {
  ASSIGNMENT_TEXT,
  type AssignmentKind,
  type AssignmentPerson,
} from "./assignment-kinds";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

const FILTERS: TableFilter<AssignmentPerson>[] = [
  { value: "all", label: "Semua", test: () => true },
  { value: "active", label: "Aktif", test: (row) => row.active },
  { value: "inactive", label: "Nonaktif", test: (row) => !row.active },
];

type AssignmentTableProps = {
  kind: AssignmentKind;
  rows: AssignmentPerson[];
  canUpdate: boolean;
  canDelete: boolean;
};

export function AssignmentTable({
  kind,
  rows,
  canUpdate,
  canDelete,
}: AssignmentTableProps) {
  const text = ASSIGNMENT_TEXT[kind];
  const notify = useStatus();
  const [target, setTarget] = useState<AssignmentPerson | null>(null);
  const [pending, startTransition] = useTransition();
  const [reasonError, setReasonError] = useState<string>();

  const columns: Column<AssignmentPerson>[] = [
    {
      key: "person",
      header: text.person,
      render: (row) => <PersonCell name={row.name} sub={row.job} />,
      sortValue: (row) => row.name,
    },
    {
      key: "items",
      header: text.item,
      render: (row) => (
        <div className="chip-list">
          {row.items.map((item) => (
            <span key={item.id} className="chip">
              {item.label}
            </span>
          ))}
        </div>
      ),
      sortValue: (row) => row.items.length,
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.active ? (
          <Badge tone="ok">Aktif</Badge>
        ) : (
          <Badge tone="bad">Akun nonaktif</Badge>
        ),
      sortValue: (row) => (row.active ? 0 : 1),
    },
  ];

  const confirmRemove = (reason: string) => {
    if (!target) return;
    const person = target;
    startTransition(async () => {
      const result =
        kind === "approver"
          ? await removeApproverAction(person.id, reason)
          : await removePicAction(person.id, reason);
      if (!result.ok && result.fieldErrors?.reason) {
        setReasonError(result.fieldErrors.reason);
        return;
      }
      setTarget(null);
      notify(
        result.message ?? (result.ok ? "Dihapus." : "Gagal menghapus."),
        result.ok ? "success" : "error",
      );
    });
  };

  return (
    <>
      <DataTable
        id={`assignment-${kind}`}
        rows={rows}
        rowKey={(row) => row.id}
        columns={columns}
        unit={text.unit}
        searchPlaceholder={`Cari nama atau ${text.itemLower}`}
        searchText={(row) =>
          [row.name, row.job, ...row.items.map((item) => item.label)].join(" ")
        }
        filters={FILTERS}
        filterLabel={`Filter ${text.person.toLowerCase()}`}
        actions={(row) => (
          <>
            {canUpdate && (
              <IconLink
                href={`${text.path}/${row.id}`}
                icon={ACTION_STYLE.update.icon}
                label={`Ubah ${row.name}`}
                tone={ACTION_STYLE.update.tone}
              />
            )}
            {canDelete && (
              <IconButton
                icon={ACTION_STYLE.delete.icon}
                label={`Hapus ${row.name}`}
                tone={ACTION_STYLE.delete.tone}
                onClick={() => setTarget(row)}
              />
            )}
          </>
        )}
        emptyIcon={UserCheck}
        emptyTitle={text.emptyTitle}
        emptyDescription={`Tambahkan lewat tombol Tambah ${text.person.toLowerCase()}.`}
      />
      {target && (
        <DeleteDialog
          title={text.removeTitle}
          description={text.removeDescription(target.name)}
          summary={[
            [text.person, target.name],
            [text.item, target.items.map((item) => item.label).join(", ")],
          ]}
          pending={pending}
          error={reasonError}
          onConfirm={confirmRemove}
          onClose={() => {
            setReasonError(undefined);
            setTarget(null);
          }}
        />
      )}
    </>
  );
}
