"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import { KeyRound } from "lucide-react";
import { resetUserPasswordAction } from "@/backend/users/actions";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/frontend/components/ui/card";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field } from "@/frontend/components/ui/field";
import { PasswordInput } from "@/frontend/components/ui/password-input";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { PASSWORD_HINT } from "@/lib/password-policy";
import type { PasswordField, PasswordResetInput } from "@/lib/schemas/user";

const LIST_PATH = "/master/pengguna";

type PasswordFormProps = {
  userId: number;
  name: string;
  email: string;
};

export function PasswordForm({ userId, name, email }: PasswordFormProps) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>(
    {},
  );
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<PasswordResetInput | null>(
    null,
  );

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setConfirmInput({
      password: String(data.get("password") ?? ""),
      confirm: String(data.get("confirm") ?? ""),
    });
  };

  const save = () => {
    if (!confirmInput) return;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = await resetUserPasswordAction(userId, confirmInput);
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
            title={`${name} (${email})`}
            description="Setelah disimpan, pengguna ini dikeluarkan dari semua perangkat dan harus masuk dengan password baru."
          />
          <CardBody>
            <div className="grid2">
              <Field
                label="Password baru"
                htmlFor="reset-password"
                required
                error={errors.password}
                hint={PASSWORD_HINT}
              >
                <PasswordInput
                  id="reset-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Masukkan password baru"
                />
              </Field>
              <Field
                label="Ulangi password baru"
                htmlFor="reset-confirm"
                required
                error={errors.confirm}
              >
                <PasswordInput
                  id="reset-confirm"
                  name="confirm"
                  autoComplete="new-password"
                  placeholder="Masukkan ulang password baru"
                />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              variant="warn"
              icon={KeyRound}
              loading={pending}
            >
              Atur ulang password
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title="Atur ulang password?"
            description={`Password ${name} (${email}) diganti, dan ia dikeluarkan dari semua perangkat.`}
            confirmLabel="Atur ulang password"
            icon={KeyRound}
            tone="warn"
            pending={pending}
            onConfirm={save}
            onClose={() => setConfirmInput(null)}
          />
        )}
      </Card>
    </>
  );
}
