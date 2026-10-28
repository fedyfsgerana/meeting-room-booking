"use client";

import { useActionState, useState } from "react";
import { AtSign, CircleHelp, LogIn } from "lucide-react";
import { loginAction } from "@/backend/auth/actions";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardBody } from "@/frontend/components/ui/card";
import { Checkbox, Field, Input } from "@/frontend/components/ui/field";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { PasswordInput } from "@/frontend/components/ui/password-input";
import type { LoginState } from "@/lib/schemas/auth";

type LoginFormProps = {
  rememberedEmail?: string;
};

export function LoginForm({ rememberedEmail }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {
      email: rememberedEmail,
      remember: Boolean(rememberedEmail),
    },
  );
  const [showHelp, setShowHelp] = useState(false);
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;
  const alertText = pending
    ? undefined
    : (state.message ??
      (emailError || passwordError ? FIELD_ALERT : undefined));

  return (
    <>
      <FormAlert message={alertText} />
      <FormAlert
        id="login-help"
        tone="info"
        message={
          showHelp
            ? "Hubungi administrator untuk mengatur ulang password."
            : undefined
        }
        onClose={() => setShowHelp(false)}
      />
      <Card className="login-card">
        <CardBody>
          <h1>Selamat datang</h1>
          <p className="lead">Masuk untuk memesan ruang meeting.</p>
          <form action={formAction} noValidate>
            <Field
              label="Email"
              htmlFor="login-email"
              error={emailError}
            >
              <Input
                id="login-email"
                name="email"
                type="email"
                icon={AtSign}
                autoComplete="email"
                placeholder="Masukkan email"
                defaultValue={state.email}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={
                  emailError ? "login-email-error" : undefined
                }
              />
            </Field>
            <Field
              label="Password"
              htmlFor="login-password"
              error={passwordError}
            >
              <PasswordInput
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder="Masukkan password"
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={
                  passwordError ? "login-password-error" : undefined
                }
              />
            </Field>
            <div className="login-row">
              <Checkbox
                name="remember"
                label="Ingat saya"
                defaultChecked={state.remember}
              />
              <button
                type="button"
                className="link-icon"
                aria-expanded={showHelp}
                aria-controls="login-help"
                onClick={() => setShowHelp((value) => !value)}
              >
                <CircleHelp aria-hidden="true" />
                Lupa password?
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              icon={LogIn}
              loading={pending}
            >
              {pending ? "Memproses" : "Masuk"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
