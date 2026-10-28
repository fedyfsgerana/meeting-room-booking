"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import { AtSign, Shuffle } from "lucide-react";
import { createUserAction, updateUserAction } from "@/backend/users/actions";
import type { UserDetail } from "@/backend/users/queries";
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
import { PasswordInput } from "@/frontend/components/ui/password-input";
import {
  SearchSelect,
  type SelectOption,
} from "@/frontend/components/ui/search-select";
import { useStatus } from "@/frontend/components/ui/status-modal";
import type { UserCreateInput, UserField } from "@/lib/schemas/user";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";
import { PASSWORD_HINT } from "@/lib/password-policy";

const LIST_PATH = "/master/pengguna";
const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function randomPassword(length = 12) {
  const values = crypto.getRandomValues(new Uint32Array(length));
  const chars = Array.from(
    values,
    (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length],
  );
  chars[values[0] % length] = String((values[1] % 8) + 2);
  return chars.join("");
}

type UserFormProps = {
  user: UserDetail | null;
  isSelf: boolean;
  departments: SelectOption[];
  groups: SelectOption[];
};

export function UserForm({ user, isSelf, departments, groups }: UserFormProps) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<UserField, string>>>({});
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<UserCreateInput | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [generated, setGenerated] = useState(0);
  const generatePassword = () => {
    setPassword(randomPassword());
    setGenerated((count) => count + 1);
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    setConfirmInput({
      email: value("email"),
      name: value("name"),
      jobTitle: value("jobTitle"),
      departmentId: value("departmentId"),
      accessGroupId:
        isSelf && user ? String(user.accessGroupId) : value("accessGroupId"),
      password: value("password"),
    });
  };

  const save = () => {
    if (!confirmInput) return;
    const { password, ...base } = confirmInput;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = user
        ? await updateUserAction(user.id, base)
        : await createUserAction({ ...base, password });
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

  const confirmName = confirmInput
    ? String(confirmInput.name).trim() || "Pengguna tanpa nama"
    : "";
  const confirmGroup =
    groups.find(
      (group) => group.value === String(confirmInput?.accessGroupId ?? ""),
    )?.label ?? "-";

  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert message={alertText} />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader
            title="Data pengguna"
            description={
              user
                ? "Password tidak berubah. Gunakan Atur ulang password untuk menggantinya."
                : "Pengguna bisa langsung masuk dengan email dan password ini."
            }
          />
          <CardBody>
            <div className="grid2">
              <Field
                label="Nama lengkap"
                htmlFor="user-name"
                required
                error={errors.name}
                hint="Contoh: Dewi Lestari."
              >
                <Input
                  id="user-name"
                  name="name"
                  defaultValue={user?.name}
                  placeholder="Masukkan nama lengkap"
                  maxLength={80}
                />
              </Field>
              <Field
                label="Departemen"
                htmlFor="user-department"
                required
                error={errors.departmentId}
              >
                <SearchSelect
                  id="user-department"
                  name="departmentId"
                  options={departments}
                  defaultValue={user ? String(user.departmentId) : ""}
                  placeholder="Pilih departemen"
                />
              </Field>
              <Field
                label="Jabatan"
                htmlFor="user-job"
                required
                error={errors.jobTitle}
                hint="Contoh: Staf Rekrutmen."
              >
                <Input
                  id="user-job"
                  name="jobTitle"
                  defaultValue={user?.jobTitle}
                  placeholder="Masukkan jabatan"
                  maxLength={80}
                />
              </Field>
              <Field
                label="Hak akses"
                htmlFor="user-group"
                required
                error={errors.accessGroupId}
                hint={
                  isSelf
                    ? "Hak akses akun sendiri tidak bisa diubah."
                    : undefined
                }
              >
                <SearchSelect
                  id="user-group"
                  name="accessGroupId"
                  options={groups}
                  defaultValue={user ? String(user.accessGroupId) : ""}
                  placeholder="Pilih hak akses"
                  disabled={isSelf}
                />
              </Field>
              <Field
                label="Email"
                htmlFor="user-email"
                required
                error={errors.email}
                hint="Dipakai untuk login. Contoh: nama@example.com."
              >
                <Input
                  id="user-email"
                  name="email"
                  type="email"
                  icon={AtSign}
                  defaultValue={user?.email ?? ""}
                  placeholder="Masukkan email"
                  maxLength={120}
                  autoComplete="off"
                />
              </Field>
              {!user && (
                <Field
                  label="Password awal"
                  htmlFor="user-password"
                  required
                  error={errors.password}
                  hint={
                    generated
                      ? "Catat password ini dan berikan ke pengguna. Pengguna wajib menggantinya saat login pertama."
                      : `${PASSWORD_HINT} Atau buat password acak.`
                  }
                >
                  <div className="input-action">
                    <PasswordInput
                      key={generated}
                      id="user-password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="Masukkan password awal"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      defaultVisible={generated > 0}
                    />
                    <Button
                      icon={Shuffle}
                      onClick={generatePassword}
                      title="Buat password acak"
                    >
                      Acak
                    </Button>
                  </div>
                </Field>
              )}
            </div>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              icon={ACTION_STYLE.save.icon}
              loading={pending}
            >
              {user ? "Simpan perubahan" : "Simpan"}
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title={
              user ? "Simpan perubahan pengguna?" : "Simpan pengguna baru?"
            }
            description={`${confirmName} (${String(confirmInput.email).trim() || "-"}), hak akses ${confirmGroup}.`}
            confirmLabel={user ? "Simpan perubahan" : "Simpan"}
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
