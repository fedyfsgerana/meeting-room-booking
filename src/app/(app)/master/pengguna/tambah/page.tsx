import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { listAccessGroupOptions } from "@/backend/access/queries";
import { requirePagePermission } from "@/backend/auth/guard";
import { listDepartmentOptions } from "@/backend/departments/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";
import { UserForm } from "@/frontend/components/users/user-form";
import {
  toDepartmentOptions,
  toGroupOptions,
} from "@/frontend/components/users/user-options";

export const metadata: Metadata = { title: "Tambah pengguna" };

async function TambahPenggunaContent() {
  await requirePagePermission("users.create");
  const [departments, groups] = await Promise.all([
    listDepartmentOptions(),
    listAccessGroupOptions(),
  ]);
  return (
    <UserForm
      user={null}
      isSelf={false}
      departments={toDepartmentOptions(departments)}
      groups={toGroupOptions(groups)}
    />
  );
}

export default function TambahPenggunaPage() {
  return (
    <>
      <PageHead
        title="Tambah pengguna"
        description="Buat akun baru untuk karyawan."
        actions={
          <ButtonLink href="/master/pengguna" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <TambahPenggunaContent />
      </Suspense>
    </>
  );
}
