"use client";

import { useState, useTransition, type SyntheticEvent } from "react";
import { CalendarX } from "lucide-react";
import { addHolidayAction, deleteHolidayAction } from "@/backend/settings/actions";
import type { HolidayRow } from "@/backend/settings/queries";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardHeader } from "@/frontend/components/ui/card";
import { DataTable, type Column } from "@/frontend/components/ui/data-table";
import { DeleteDialog } from "@/frontend/components/ui/delete-dialog";
import { Field, Input } from "@/frontend/components/ui/field";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { formatLongDate } from "@/lib/format";
import type { HolidayField } from "@/lib/schemas/settings";

const COLUMNS: Column<HolidayRow>[] = [
  {
    key: "date",
    header: "Tanggal",
    render: (row) => formatLongDate(row.date),
    sortValue: (row) => row.date,
    className: "nowrap",
  },
  {
    key: "name",
    header: "Keterangan",
    render: (row) => row.name,
    sortValue: (row) => row.name,
  },
];

type HolidaysManagerProps = {
  holidays: HolidayRow[];
  canEdit: boolean;
};

export function HolidaysManager({ holidays, canEdit }: HolidaysManagerProps) {
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<HolidayField, string>>>({});
  const [formKey, setFormKey] = useState(0);
  const [target, setTarget] = useState<HolidayRow | null>(null);
  const [reasonError, setReasonError] = useState<string>();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = { date: String(data.get("date") ?? ""), name: String(data.get("name") ?? "") };
    setErrors({});
    startTransition(async () => {
      const result = await addHolidayAction(input);
      if (result.ok) {
        setFormKey((key) => key + 1);
        notify(result.message ?? "Hari libur ditambahkan.", "success");
        return;
      }
      if (result.fieldErrors) setErrors(result.fieldErrors);
      else notify(result.message ?? "Gagal menambah hari libur.", "error");
    });
  };

  const confirmDelete = (reason: string) => {
    if (!target) return;
    const holiday = target;
    startTransition(async () => {
      const result = await deleteHolidayAction(holiday.id, reason);
      if (!result.ok && result.fieldErrors?.reason) {
        setReasonError(result.fieldErrors.reason);
        return;
      }
      setTarget(null);
      setReasonError(undefined);
      notify(result.message ?? (result.ok ? "Hari libur dihapus." : "Gagal menghapus."), result.ok ? "success" : "error");
    });
  };

  return (
    <div className="stack">
      <Card>
        <CardHeader title="Hari libur" description="Pada tanggal ini ruang meeting tidak bisa dipesan." />
        {canEdit && (
          <form key={formKey} className="inline-form" onSubmit={onSubmit} noValidate>
            <Field label="Tanggal" htmlFor="holiday-date" required error={errors.date}>
              <Input id="holiday-date" name="date" type="date" />
            </Field>
            <Field
              label="Keterangan"
              htmlFor="holiday-name"
              required
              error={errors.name}
              className="grow"
              hint="Contoh: Hari Raya Natal."
            >
              <Input id="holiday-name" name="name" placeholder="Masukkan keterangan" maxLength={100} />
            </Field>
            <Button type="submit" variant="primary" icon={ACTION_STYLE.create.icon} loading={pending}>
              Tambah
            </Button>
          </form>
        )}
      </Card>
      <DataTable
        id="holidays"
        rows={holidays}
        rowKey={(row) => row.id}
        columns={COLUMNS}
        unit="hari libur"
        searchPlaceholder="Cari keterangan"
        searchText={(row) => row.name}
        actions={
          canEdit
            ? (row) => (
                <IconButton
                  icon={ACTION_STYLE.delete.icon}
                  label={`Hapus ${row.name}`}
                  tone={ACTION_STYLE.delete.tone}
                  onClick={() => setTarget(row)}
                />
              )
            : undefined
        }
        emptyIcon={CalendarX}
        emptyTitle="Belum ada hari libur"
        emptyDescription={canEdit ? "Tambahkan lewat form di atas." : "Belum ada hari libur yang ditetapkan."}
      />
      {target && (
        <DeleteDialog
          title="Hapus hari libur?"
          description={`${target.name} dihapus dari daftar hari libur, sehingga ruang bisa dipesan pada tanggal itu.`}
          summary={[["Tanggal", formatLongDate(target.date)]]}
          pending={pending}
          error={reasonError}
          onConfirm={confirmDelete}
          onClose={() => {
            setReasonError(undefined);
            setTarget(null);
          }}
        />
      )}
    </div>
  );
}
