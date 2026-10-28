import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { DepartmentForm } from "@/frontend/components/departments/department-form";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Tambah departemen" };

async function TambahDepartemenContent() {
  await requirePagePermission("departments.create");
  return <DepartmentForm department={null} />;
}

export default function TambahDepartemenPage() {
  return (
    <>
      <PageHead
        title="Tambah departemen"
        description="Isi nama dan kode departemen baru."
        actions={
          <ButtonLink href="/master/departemen" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <TambahDepartemenContent />
      </Suspense>
    </>
  );
}
