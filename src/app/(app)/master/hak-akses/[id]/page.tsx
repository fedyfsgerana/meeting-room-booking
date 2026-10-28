import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getAccessGroup } from "@/backend/access/queries";
import { requirePagePermission } from "@/backend/auth/guard";
import {
  listDepartmentOptions,
  toDepartmentOptions,
} from "@/backend/departments/queries";
import { AccessForm } from "@/frontend/components/access/access-form";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Ubah hak akses" };

type UbahHakAksesPageProps = { params: Promise<{ id: string }> };

async function UbahHakAksesContent({ params }: UbahHakAksesPageProps) {
  const me = await requirePagePermission("access.view");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [group, departments] = await Promise.all([
    getAccessGroup(id),
    listDepartmentOptions(),
  ]);
  if (!group) notFound();
  return (
    <AccessForm
      group={group}
      departments={toDepartmentOptions(departments)}
      readOnly={!me.permissions.includes("access.update")}
    />
  );
}

export default function UbahHakAksesPage({ params }: UbahHakAksesPageProps) {
  return (
    <>
      <PageHead
        title="Ubah hak akses"
        description="Pilih menu dan aksi untuk hak akses ini."
        actions={
          <ButtonLink href="/master/hak-akses" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <UbahHakAksesContent params={params} />
      </Suspense>
    </>
  );
}
