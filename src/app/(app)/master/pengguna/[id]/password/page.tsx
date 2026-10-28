import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getUser } from "@/backend/users/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { PasswordForm } from "@/frontend/components/users/password-form";

export const metadata: Metadata = { title: "Atur ulang password" };

type ResetPasswordPageProps = { params: Promise<{ id: string }> };

async function ResetPasswordContent({ params }: ResetPasswordPageProps) {
  await requirePagePermission("users.reset_password");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const user = await getUser(id);
  if (!user) notFound();
  return (
    <PasswordForm userId={user.id} name={user.name} email={user.email} />
  );
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  return (
    <>
      <PageHead
        title="Atur ulang password"
        description="Tetapkan password baru untuk pengguna."
        actions={
          <ButtonLink href="/master/pengguna" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <ResetPasswordContent params={params} />
      </Suspense>
    </>
  );
}
