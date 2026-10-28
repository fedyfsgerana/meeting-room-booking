import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getDepartment } from "@/backend/departments/queries";
import { DepartmentForm } from "@/frontend/components/departments/department-form";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Ubah departemen" };

type Props = { params: Promise<{ id: string }> };

async function UbahDepartemenContent({ params }: Props) {
  await requirePagePermission("departments.update");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const department = await getDepartment(id);
  if (!department) notFound();
  return <DepartmentForm department={department} />;
}

export default function UbahDepartemenPage({ params }: Props) {
  return (
    <>
      <PageHead
        title="Ubah departemen"
        description="Perbarui nama, kode, atau status departemen."
        actions={
          <ButtonLink href="/master/departemen" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <UbahDepartemenContent params={params} />
      </Suspense>
    </>
  );
}
