import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import {
  listDepartmentOptions,
  toDepartmentOptions,
} from "@/backend/departments/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { AssignmentForm } from "@/frontend/components/master/assignment-form";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Tambah penyetuju" };

async function Content() {
  await requirePagePermission("approvers.create");
  const targets = await listDepartmentOptions();
  return (
    <AssignmentForm
      kind="approver"
      current={null}
      targets={toDepartmentOptions(targets)}
    />
  );
}

export default function Page() {
  return (
    <>
      <PageHead
        title="Tambah penyetuju"
        description="Pilih akun lalu departemen yang booking-nya ia setujui."
        actions={
          <ButtonLink href="/master/penyetuju" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <Content />
      </Suspense>
    </>
  );
}
