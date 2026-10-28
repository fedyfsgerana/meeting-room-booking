import type { Metadata } from "next";
import { RetryButton } from "@/frontend/components/errors/error-actions";
import { ErrorScreen } from "@/frontend/components/errors/error-screen";

export const metadata: Metadata = { title: "Sedang pemeliharaan" };

export default function PemeliharaanPage() {
  return (
    <ErrorScreen
      type="503"
      actions={<RetryButton label="Muat ulang" />}
      meta="Halaman ini otomatis bisa dipakai lagi setelah pemeliharaan selesai."
    />
  );
}
