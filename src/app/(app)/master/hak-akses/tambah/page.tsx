import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import {
  listDepartmentOptions,
  toDepartmentOptions,
} from "@/backend/departments/queries";
import { AccessForm } from "@/frontend/components/access/access-form";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Tambah hak akses" };

async function TambahHakAksesContent() {
  await requirePagePermission("access.create");
  const departments = await listDepartmentOptions();
  return (
    <AccessForm group={null} departments={toDepartmentOptions(departments)} />
  );
}

export default function TambahHakAksesPage() {
  return (
    <>
      <PageHead
        title="Tambah hak akses"
        description="Beri nama lalu pilih menu dan aksi yang boleh dipakai."
        actions={
          <ButtonLink href="/master/hak-akses" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <TambahHakAksesContent />
      </Suspense>
    </>
  );
}
