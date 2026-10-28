"use client";

import "@/frontend/styles/01-tokens.css";
import "@/frontend/styles/02-base.css";
import "@/frontend/styles/03-brand.css";
import "@/frontend/styles/04-buttons.css";
import "@/frontend/styles/09-login.css";
import "@/frontend/styles/13-errors.css";
import { RetryButton } from "@/frontend/components/errors/error-actions";
import { ErrorScreen } from "@/frontend/components/errors/error-screen";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <ErrorScreen
          type="500"
          actions={<RetryButton label="Muat ulang" onRetry={reset} />}
          meta={error.digest ? `ID kesalahan: ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
