import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { listAccessGroupOptions } from "@/backend/access/queries";
import { requirePagePermission } from "@/backend/auth/guard";
import { listDepartmentOptions } from "@/backend/departments/queries";
import { getUser } from "@/backend/users/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { UserForm } from "@/frontend/components/users/user-form";
import {
  toDepartmentOptions,
  toGroupOptions,
} from "@/frontend/components/users/user-options";

export const metadata: Metadata = { title: "Ubah pengguna" };

type UbahPenggunaPageProps = { params: Promise<{ id: string }> };

async function UbahPenggunaContent({ params }: UbahPenggunaPageProps) {
  const me = await requirePagePermission("users.update");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [user, departments, groups] = await Promise.all([
    getUser(id),
    listDepartmentOptions(),
    listAccessGroupOptions(),
  ]);
  if (!user) notFound();

  return (
    <UserForm
      user={user}
      isSelf={user.id === me.id}
      departments={toDepartmentOptions(departments)}
      groups={toGroupOptions(groups)}
    />
  );
}

export default function UbahPenggunaPage({ params }: UbahPenggunaPageProps) {
  return (
    <>
      <PageHead
        title="Ubah pengguna"
        description="Perbarui data akun pengguna."
        actions={
          <ButtonLink href="/master/pengguna" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <UbahPenggunaContent params={params} />
      </Suspense>
    </>
  );
}
