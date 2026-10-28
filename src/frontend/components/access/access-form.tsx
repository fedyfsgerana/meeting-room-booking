"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import {
  createAccessGroupAction,
  updateAccessGroupAction,
} from "@/backend/access/actions";
import type { AccessGroupDetail } from "@/backend/access/queries";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/frontend/components/ui/card";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Input } from "@/frontend/components/ui/field";
import { MultiSelect } from "@/frontend/components/ui/multi-select";
import {
  SearchSelect,
  type SelectOption,
} from "@/frontend/components/ui/search-select";
import { useStatus } from "@/frontend/components/ui/status-modal";
import {
  ACCESS_DESCRIPTIONS,
  ALL_PERMISSIONS,
  type Permission,
} from "@/lib/permissions";
import { PermissionMatrix } from "./permission-matrix";
import type { AccessGroupField, AccessGroupInput } from "@/lib/schemas/access";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

const LIST_PATH = "/master/hak-akses";
const DESCRIPTION_OPTIONS = ACCESS_DESCRIPTIONS.map((value) => ({
  value,
  label: value.replace(/\.$/, ""),
}));

type AccessFormProps = {
  group: AccessGroupDetail | null;
  departments: SelectOption[];
  readOnly?: boolean;
};

export function AccessForm({
  group,
  departments,
  readOnly = false,
}: AccessFormProps) {
  const locked = group?.locked ?? false;
  const frozen = locked || readOnly;
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<
    Partial<Record<AccessGroupField, string>>
  >({});
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<AccessGroupInput | null>(
    null,
  );

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setConfirmInput({
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      permissions: data.getAll("permissions").map(String) as Permission[],
      departmentIds: data.getAll("departmentIds").map(String),
    });
  };

  const save = () => {
    if (!confirmInput) return;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = group
        ? await updateAccessGroupAction(group.id, confirmInput)
        : await createAccessGroupAction(confirmInput);
      setConfirmInput(null);
      if (result.ok) {
        notify(result.message ?? "Tersimpan.", "success");
        router.push(LIST_PATH);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert message={alertText} />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader
            title="Data hak akses"
            description={
              locked
                ? "Hak akses ini terkunci dan selalu memegang semua menu dan aksi."
                : readOnly
                  ? "Anda hanya bisa melihat hak akses ini."
                  : group
                    ? "Perubahan berlaku saat pengguna dengan hak akses ini membuka halaman berikutnya."
                    : "Hak akses baru bisa langsung dipilih untuk pengguna di Master → Pengguna."
            }
          />
          <fieldset className="plain-fieldset" disabled={frozen}>
            <CardBody>
              <div className="grid2">
                <Field
                  label="Nama hak akses"
                  htmlFor="group-name"
                  required
                  error={errors.name}
                >
                  <Input
                    id="group-name"
                    name="name"
                    defaultValue={group?.name}
                    placeholder="Masukkan nama hak akses"
                    maxLength={60}
                  />
                </Field>
                <Field
                  label="Deskripsi"
                  htmlFor="group-description"
                  error={errors.description}
                  hint="Gambaran singkat siapa yang memakai hak akses ini."
                >
                  <SearchSelect
                    id="group-description"
                    name="description"
                    options={DESCRIPTION_OPTIONS}
                    defaultValue={group?.description ?? ""}
                    placeholder="Pilih deskripsi"
                  />
                </Field>
                <Field
                  label="Departemen yang bisa dipesankan"
                  htmlFor="group-departments"
                  error={errors.departmentIds}
                  hint={
                    locked
                      ? "Hak akses ini bisa memesankan untuk semua departemen."
                      : "Departemen utama setiap pengguna selalu termasuk. Tambahkan departemen lain yang boleh dipesankan pengguna dengan hak akses ini."
                  }
                >
                  <MultiSelect
                    id="group-departments"
                    name="departmentIds"
                    options={departments}
                    defaultValues={group?.departmentIds.map(String) ?? []}
                    placeholder={
                      locked ? "Semua departemen" : "Pilih departemen"
                    }
                    disabled={locked}
                  />
                </Field>
              </div>
              <div className={errors.permissions ? "field invalid" : "field"}>
                <span className="label">Menu dan aksi</span>
                <PermissionMatrix
                  defaultValues={
                    locked ? ALL_PERMISSIONS : (group?.permissions ?? [])
                  }
                  disabled={locked || readOnly}
                />
                {errors.permissions && (
                  <div className="err" role="alert">
                    {errors.permissions}
                  </div>
                )}
              </div>
            </CardBody>
          </fieldset>
          {!frozen && (
            <CardFooter>
              <Button
                type="submit"
                variant="primary"
                icon={ACTION_STYLE.save.icon}
                loading={pending}
              >
                {group ? "Simpan perubahan" : "Simpan"}
              </Button>
            </CardFooter>
          )}
        </form>
        {confirmInput && (
          <ConfirmDialog
            title={
              group ? "Simpan perubahan hak akses?" : "Simpan hak akses baru?"
            }
            description={`${String(confirmInput.name).trim() || group?.name || "Hak akses baru"}: ${confirmInput.permissions?.length ?? 0} dari ${ALL_PERMISSIONS.length} aksi dipilih. Berlaku saat pengguna membuka halaman berikutnya.`}
            confirmLabel={group ? "Simpan perubahan" : "Simpan"}
            icon={ACTION_STYLE.save.icon}
            pending={pending}
            onConfirm={save}
            onClose={() => setConfirmInput(null)}
          />
        )}
      </Card>
    </>
  );
}
