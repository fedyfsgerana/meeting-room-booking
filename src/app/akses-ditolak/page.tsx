import type { Metadata } from "next";
import { House } from "lucide-react";
import { BackButton } from "@/frontend/components/errors/error-actions";
import { ErrorScreen } from "@/frontend/components/errors/error-screen";
import { ButtonLink } from "@/frontend/components/ui/button-link";

export const metadata: Metadata = { title: "Akses ditolak" };

export default function AksesDitolakPage() {
  return (
    <ErrorScreen
      type="403"
      actions={
        <>
          <BackButton />
          <ButtonLink href="/" variant="primary" icon={House}>
            Ke Beranda
          </ButtonLink>
        </>
      }
    />
  );
}
