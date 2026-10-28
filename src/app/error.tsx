"use client";

import { House } from "lucide-react";
import { RetryButton } from "@/frontend/components/errors/error-actions";
import { ErrorScreen } from "@/frontend/components/errors/error-screen";
import { ButtonLink } from "@/frontend/components/ui/button-link";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <ErrorScreen
      type="500"
      actions={
        <>
          <ButtonLink href="/" icon={House}>
            Ke Beranda
          </ButtonLink>
          <RetryButton label="Muat ulang" onRetry={reset} />
        </>
      }
      meta={error.digest ? `ID kesalahan: ${error.digest}` : undefined}
    />
  );
}
