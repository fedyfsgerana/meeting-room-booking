import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import {
  countDepartmentsWithoutApprover,
  listApproverPeople,
} from "@/backend/departments/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { Can } from "@/frontend/components/auth/can";
import { AssignmentTable } from "@/frontend/components/master/assignment-table";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { FormAlert } from "@/frontend/components/ui/form-alert";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Penyetuju" };

async function Content() {
  const me = await requirePagePermission("approvers.view");
  const [rows, missing] = await Promise.all([
    listApproverPeople(),
    countDepartmentsWithoutApprover(),
  ]);
  return (
    <>
      <FormAlert
        tone="warning"
        message={
          missing
            ? `${missing} departemen belum punya penyetuju, sehingga belum bisa mengajukan booking.`
            : undefined
        }
      />
      <AssignmentTable
        kind="approver"
        rows={rows}
        canUpdate={me.permissions.includes("approvers.update")}
        canDelete={me.permissions.includes("approvers.delete")}
      />
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHead
        title="Penyetuju"
        description="Penyetuju yang menyetujui booking dari departemennya. Departemen diambil dari master data."
        actions={
          <Can permission="approvers.create">
            <ButtonLink
              href="/master/penyetuju/tambah"
              variant="primary"
              icon={Plus}
            >
              Tambah penyetuju
            </ButtonLink>
          </Can>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} />}>
        <Content />
      </Suspense>
    </>
  );
}
