"use client";

import { useState, useTransition, type SyntheticEvent } from "react";
import { Save } from "lucide-react";
import { updateSettingsAction } from "@/backend/settings/actions";
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
import { SearchSelect } from "@/frontend/components/ui/search-select";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { cx } from "@/lib/cx";
import type { SettingsField, SettingsInput } from "@/lib/schemas/settings";
import {
  DAY_LABELS,
  DAY_ORDER,
  DAY_SHORT,
  DRAFT_TIMEOUT_OPTIONS,
  durationLabel,
  minutesToTime,
  type AppSettings,
} from "@/lib/settings";

const DRAFT_OPTIONS = DRAFT_TIMEOUT_OPTIONS.map((minutes) => ({
  value: String(minutes),
  label: durationLabel(minutes),
}));

export function SettingsForm({
  settings,
  readOnly = false,
}: {
  settings: AppSettings;
  readOnly?: boolean;
}) {
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<SettingsField, string>>>(
    {},
  );
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<SettingsInput | null>(null);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setConfirmInput({
      draftTimeoutMinutes: String(data.get("draftTimeoutMinutes") ?? ""),
      operationalDays: data.getAll("operationalDays").map(String),
      openMinute: String(data.get("openMinute") ?? ""),
      closeMinute: String(data.get("closeMinute") ?? ""),
    });
  };

  const save = () => {
    if (!confirmInput) return;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = await updateSettingsAction(confirmInput);
      setConfirmInput(null);
      if (result.ok) {
        setErrors({});
        setMessage(undefined);
        notify(result.message ?? "Tersimpan.", "success");
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <div className="stack">
      <FormAlert message={alertText} />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader
            title="Batas waktu dan jam operasional"
            description="Berlaku untuk booking baru setelah disimpan."
          />
          <fieldset className="plain-fieldset" disabled={readOnly}>
            <CardBody>
              <Field
                label="Batas waktu Draft"
                htmlFor="set-draft"
                error={errors.draftTimeoutMinutes}
                hint="Lewat dari ini, booking yang belum disetujui penyetuju batal otomatis. Batas tidak pernah melewati jam mulai meeting."
              >
                <SearchSelect
                  id="set-draft"
                  name="draftTimeoutMinutes"
                  options={DRAFT_OPTIONS}
                  defaultValue={String(settings.draftTimeoutMinutes)}
                />
              </Field>
              <div className="grid2">
                <Field
                  label="Jam buka"
                  htmlFor="set-open"
                  error={errors.openMinute}
                >
                  <Input
                    id="set-open"
                    name="openMinute"
                    type="time"
                    defaultValue={minutesToTime(settings.openMinute)}
                  />
                </Field>
                <Field
                  label="Jam tutup"
                  htmlFor="set-close"
                  error={errors.closeMinute}
                >
                  <Input
                    id="set-close"
                    name="closeMinute"
                    type="time"
                    defaultValue={minutesToTime(settings.closeMinute)}
                  />
                </Field>
              </div>
              <div className={cx("field", errors.operationalDays && "invalid")}>
                <span className="label">Hari operasional</span>
                <div className="day-pick">
                  {DAY_ORDER.map((day) => (
                    <label key={day} title={DAY_LABELS[day]}>
                      <input
                        type="checkbox"
                        name="operationalDays"
                        value={day}
                        defaultChecked={settings.operationalDays.includes(day)}
                      />
                      {DAY_SHORT[day]}
                    </label>
                  ))}
                </div>
                {errors.operationalDays ? (
                  <div className="err" role="alert">
                    {errors.operationalDays}
                  </div>
                ) : (
                  <div className="hint">
                    Ruang hanya bisa dipesan pada hari dan jam operasional.
                  </div>
                )}
              </div>
            </CardBody>
          </fieldset>
          {!readOnly && (
            <CardFooter>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={pending}
              >
                Simpan pengaturan
              </Button>
            </CardFooter>
          )}
        </form>
        {confirmInput && (
          <ConfirmDialog
            title="Simpan pengaturan?"
            description={`Batas Draft ${durationLabel(Number(confirmInput.draftTimeoutMinutes))}, jam operasional ${String(confirmInput.openMinute)}–${String(confirmInput.closeMinute)}, ${confirmInput.operationalDays.length} hari operasional. Berlaku untuk booking baru.`}
            confirmLabel="Simpan pengaturan"
            icon={Save}
            pending={pending}
            onConfirm={save}
            onClose={() => setConfirmInput(null)}
          />
        )}
      </Card>
    </div>
  );
}
