import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import {
  getApproverPerson,
  listDepartmentOptions,
  toDepartmentOptions,
} from "@/backend/departments/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { AssignmentForm } from "@/frontend/components/master/assignment-form";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Ubah penyetuju" };

type Props = { params: Promise<{ id: string }> };

async function Content({ params }: Props) {
  await requirePagePermission("approvers.update");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [current, targets] = await Promise.all([
    getApproverPerson(id),
    listDepartmentOptions(),
  ]);
  if (!current) notFound();
  return (
    <AssignmentForm
      kind="approver"
      current={current}
      targets={toDepartmentOptions(targets)}
    />
  );
}

export default function Page({ params }: Props) {
  return (
    <>
      <PageHead
        title="Ubah penyetuju"
        description="Perbarui departemen yang disetujuinya."
        actions={
          <ButtonLink href="/master/penyetuju" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}
