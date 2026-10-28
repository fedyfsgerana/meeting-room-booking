"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import { createDepartmentAction, updateDepartmentAction } from "@/backend/departments/crud-actions";
import type { DepartmentDetail } from "@/backend/departments/queries";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/frontend/components/ui/card";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Checkbox, Field, Input } from "@/frontend/components/ui/field";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { useStatus } from "@/frontend/components/ui/status-modal";
import type { DepartmentField, DepartmentInput } from "@/lib/schemas/department";

const LIST_PATH = "/master/departemen";

export function DepartmentForm({ department }: { department: DepartmentDetail | null }) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<DepartmentField, string>>>({});
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<DepartmentInput | null>(null);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setConfirmInput({
      code: String(data.get("code") ?? ""),
      name: String(data.get("name") ?? ""),
      active: data.get("active") === "on",
    });
  };

  const save = () => {
    if (!confirmInput) return;
    const input = confirmInput;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = department ? await updateDepartmentAction(department.id, input) : await createDepartmentAction(input);
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

  const alertText = message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert message={alertText} />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader title="Data departemen" />
          <CardBody>
            <div className="grid2">
              <Field label="Nama departemen" htmlFor="department-name" required error={errors.name} hint="Contoh: Information Technology.">
                <Input
                  id="department-name"
                  name="name"
                  defaultValue={department?.name}
                  placeholder="Masukkan nama departemen"
                  maxLength={80}
                />
              </Field>
              <Field
                label="Kode"
                htmlFor="department-code"
                required
                error={errors.code}
                hint="2–10 huruf, angka, atau strip. Contoh: IT."
              >
                <Input
                  id="department-code"
                  name="code"
                  defaultValue={department?.code}
                  placeholder="Masukkan kode"
                  maxLength={10}
                  autoComplete="off"
                />
              </Field>
            </div>
            <Checkbox name="active" label="Departemen aktif" defaultChecked={department?.active ?? true} />
          </CardBody>
          <CardFooter>
            <Button type="submit" variant="primary" icon={ACTION_STYLE.save.icon} loading={pending}>
              {department ? "Simpan perubahan" : "Simpan"}
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title={department ? "Simpan perubahan departemen?" : "Simpan departemen baru?"}
            description={`${confirmInput.name} (${String(confirmInput.code).toUpperCase()}).`}
            confirmLabel={department ? "Simpan perubahan" : "Simpan"}
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
