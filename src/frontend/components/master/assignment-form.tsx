"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import { saveApproverAction } from "@/backend/departments/actions";
import { savePicAction } from "@/backend/rooms/actions";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/frontend/components/ui/card";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Input } from "@/frontend/components/ui/field";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { MultiSelect } from "@/frontend/components/ui/multi-select";
import type { SelectOption } from "@/frontend/components/ui/search-select";
import { useStatus } from "@/frontend/components/ui/status-modal";
import type {
  AssignmentField,
  AssignmentInput,
} from "@/lib/schemas/assignment";
import { ASSIGNMENT_TEXT, type AssignmentKind } from "./assignment-kinds";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type AssignmentFormProps = {
  kind: AssignmentKind;
  current: { userId: number; name: string; targetIds: number[] } | null;
  targets: SelectOption[];
};

const HINT = {
  approver: {
    person:
      "Ketik email akun yang punya hak Persetujuan penyetuju.",
    targets:
      "Bisa lebih dari satu. Penyetuju menyetujui booking dari departemen ini.",
  },
  pic: {
    person:
      "Ketik email akun yang punya hak Cek penanggung jawab ruang.",
    targets:
      "Bisa lebih dari satu. Satu ruang hanya punya satu Penanggung Jawab Ruang, jadi ruang yang dipilih pindah ke orang ini.",
  },
} as const;

export function AssignmentForm({
  kind,
  current,
  targets,
}: AssignmentFormProps) {
  const text = ASSIGNMENT_TEXT[kind];
  const isNew = current === null;
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<
    Partial<Record<AssignmentField, string>>
  >({});
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<AssignmentInput | null>(
    null,
  );

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setConfirmInput({
      userId: current ? String(current.userId) : "",
      account: current ? "" : String(data.get("account") ?? ""),
      targetIds: data.getAll("targetIds").map(String),
    });
  };

  const save = () => {
    if (!confirmInput) return;
    const input = confirmInput;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result =
        kind === "approver"
          ? await saveApproverAction(input, isNew)
          : await savePicAction(input, isNew);
      setConfirmInput(null);
      if (result.ok) {
        notify(result.message ?? "Tersimpan.", "success");
        router.push(text.path);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const personLabel = current?.name ?? (String(confirmInput?.account ?? "").trim() || "Akun");
  const targetLabels = targets
    .filter((option) => confirmInput?.targetIds?.includes(option.value))
    .map((option) => option.label.split(" ·")[0]);
  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert message={alertText} />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader title={`Data ${text.person.toLowerCase()}`} />
          <CardBody>
            <div className="grid2">
              <Field
                label={text.person}
                htmlFor="assignment-user"
                required
                error={errors.account ?? errors.userId}
                hint={isNew ? HINT[kind].person : undefined}
              >
                {isNew ? (
                  <Input
                    id="assignment-user"
                    name="account"
                    placeholder="Masukkan email akun"
                    type="email"
                    autoComplete="off"
                  />
                ) : (
                  <Input id="assignment-user" value={current.name} readOnly />
                )}
              </Field>
              <Field
                label={text.item}
                htmlFor="assignment-targets"
                required
                error={errors.targetIds}
                hint={HINT[kind].targets}
              >
                <MultiSelect
                  id="assignment-targets"
                  name="targetIds"
                  options={targets}
                  defaultValues={current?.targetIds.map(String) ?? []}
                  placeholder={`Pilih ${text.itemLower}`}
                />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              icon={ACTION_STYLE.save.icon}
              loading={pending}
            >
              {isNew ? "Simpan" : "Simpan perubahan"}
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title={
              isNew
                ? `Simpan ${text.person.toLowerCase()} baru?`
                : "Simpan perubahan?"
            }
            description={`${personLabel}: ${targetLabels.length ? targetLabels.join(", ") : `belum memilih ${text.itemLower}`}.`}
            confirmLabel={isNew ? "Simpan" : "Simpan perubahan"}
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
