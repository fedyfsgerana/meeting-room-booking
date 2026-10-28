import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { ErrorScreen } from "@/frontend/components/errors/error-screen";
import { ButtonLink } from "@/frontend/components/ui/button-link";

export const metadata: Metadata = { title: "Sesi berakhir" };

export default function SesiBerakhirPage() {
  return (
    <ErrorScreen
      type="401"
      actions={
        <ButtonLink href="/login" variant="primary" icon={LogIn}>
          Masuk
        </ButtonLink>
      }
    />
  );
}
