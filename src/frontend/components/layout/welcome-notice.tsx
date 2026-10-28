"use client";

import { useEffect } from "react";
import { useStatus } from "@/frontend/components/ui/status-modal";
import { WELCOME_COOKIE } from "@/lib/auth-cookie";

export function WelcomeNotice({
  name,
  accessName,
}: {
  name: string;
  accessName: string;
}) {
  const notify = useStatus();

  useEffect(() => {
    if (
      !document.cookie
        .split("; ")
        .some((entry) => entry.startsWith(`${WELCOME_COOKIE}=`))
    )
      return;
    document.cookie = `${WELCOME_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
    notify(
      `Selamat datang, ${name}. Anda masuk sebagai ${accessName}.`,
      "success",
      { title: "Login berhasil" },
    );
  }, [name, accessName, notify]);

  return null;
}
