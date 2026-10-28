"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import { ArrowLeft, KeyRound, LogOut } from "lucide-react";
import { logoutAction } from "@/backend/auth/actions";
import { changeOwnPasswordAction } from "@/backend/auth/account-actions";
import { Button } from "@/frontend/components/ui/button";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { Card, CardBody } from "@/frontend/components/ui/card";
import { Field } from "@/frontend/components/ui/field";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { PasswordInput } from "@/frontend/components/ui/password-input";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { PASSWORD_HINT } from "@/lib/password-policy";
import type { PasswordChangeField } from "@/lib/schemas/user";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<PasswordChangeField, string>>>({});
  const [message, setMessage] = useState<string>();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      current: String(data.get("current") ?? ""),
      password: String(data.get("password") ?? ""),
      confirm: String(data.get("confirm") ?? ""),
    };
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = await changeOwnPasswordAction(input);
      if (result.ok) {
        router.replace("/");
        router.refresh();
        notify(result.message ?? "Password diganti.", "success");
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const alertText = message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert
        tone="info"
        message={forced ? "Demi keamanan, ganti password awal Anda sebelum memakai aplikasi." : undefined}
      />
      <FormAlert message={alertText} />
      <Card className="login-card">
        <CardBody>
          <h1>Ganti password</h1>
          <p className="lead">{forced ? "Password ini dibuat administrator. Buat password baru milik Anda sendiri." : "Ganti password akun Anda."}</p>
          <form onSubmit={onSubmit} noValidate>
            <Field label="Password saat ini" htmlFor="change-current" required error={errors.current}>
              <PasswordInput id="change-current" name="current" autoComplete="current-password" placeholder="Masukkan password saat ini" />
            </Field>
            <Field label="Password baru" htmlFor="change-password" required error={errors.password} hint={PASSWORD_HINT}>
              <PasswordInput id="change-password" name="password" autoComplete="new-password" placeholder="Masukkan password baru" />
            </Field>
            <Field
              label="Ulangi password baru"
              htmlFor="change-confirm"
              required
              error={errors.confirm}
              hint="Setelah diganti, sesi di perangkat lain akan dikeluarkan."
            >
              <PasswordInput id="change-confirm" name="confirm" autoComplete="new-password" placeholder="Masukkan ulang password baru" />
            </Field>
            <Button type="submit" variant="primary" icon={KeyRound} loading={pending}>
              Ganti password
            </Button>
          </form>
          <div className="login-row change-foot">
            {forced ? (
              <Button variant="plain" icon={LogOut} onClick={() => startTransition(() => logoutAction())} disabled={pending}>
                Keluar
              </Button>
            ) : (
              <ButtonLink href="/" variant="plain" icon={ArrowLeft}>
                Kembali ke beranda
              </ButtonLink>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
}
