import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { House } from "lucide-react";
import { RetryButton } from "@/frontend/components/errors/error-actions";
import { ErrorScreen } from "@/frontend/components/errors/error-screen";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { ERROR_CONTENT } from "@/lib/errors";

const CODES = ["400", "408", "429", "502", "504"] as const;

type Code = (typeof CODES)[number];

type GalatPageProps = { params: Promise<{ kode: string }> };

export function generateStaticParams() {
  return CODES.map((kode) => ({ kode }));
}

export async function generateMetadata({
  params,
}: GalatPageProps): Promise<Metadata> {
  const { kode } = await params;
  return {
    title: CODES.includes(kode as Code)
      ? ERROR_CONTENT[kode as Code].title
      : "Halaman tidak ditemukan",
  };
}

export default async function GalatPage({ params }: GalatPageProps) {
  const { kode } = await params;
  if (!CODES.includes(kode as Code)) notFound();
  const code = kode as Code;

  return (
    <ErrorScreen
      type={code}
      actions={
        code === "429" ? (
          <RetryButton />
        ) : (
          <>
            <ButtonLink href="/" icon={House}>
              Ke Beranda
            </ButtonLink>
            <RetryButton />
          </>
        )
      }
      meta={
        code === "429"
          ? "Tunggu sekitar satu menit sebelum mencoba lagi."
          : undefined
      }
    />
  );
}
