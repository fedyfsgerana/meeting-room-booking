import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  approvalModesFor,
  countApprovals,
  listApprovals,
} from "@/backend/approvals/queries";
import { getSessionUser } from "@/backend/auth/session";
import { ApprovalTabs } from "@/frontend/components/approvals/approval-tabs";
import { ApprovalsManager } from "@/frontend/components/approvals/approvals-manager";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { PageHead } from "@/frontend/components/ui/page-head";
import { APPROVAL_MODE_DESCRIPTION, type ApprovalMode } from "@/lib/approvals";

export const metadata: Metadata = { title: "Persetujuan" };

type PersetujuanPageProps = { searchParams: Promise<{ tahap?: string }> };

async function PersetujuanContent({ searchParams }: PersetujuanPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const modes = approvalModesFor(user);
  if (!modes.length) redirect("/akses-ditolak");

  const requested = (await searchParams).tahap as ApprovalMode | undefined;
  const mode = requested && modes.includes(requested) ? requested : modes[0];
  const [counts, rows] = await Promise.all([
    countApprovals(user),
    listApprovals(mode, user),
  ]);

  return (
    <>
      <PageHead
        title="Persetujuan"
        description={APPROVAL_MODE_DESCRIPTION[mode]}
      />
      <ApprovalsManager
        mode={mode}
        rows={rows}
        tabs={<ApprovalTabs modes={modes} current={mode} counts={counts} />}
        canApprove={user.permissions.includes(
          mode === "approver" ? "approve_dept.approve" : "approve_room.approve",
        )}
        canReject={user.permissions.includes(
          mode === "approver" ? "approve_dept.reject" : "approve_room.reject",
        )}
      />
    </>
  );
}

export default function PersetujuanPage(props: PersetujuanPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PersetujuanContent {...props} />
    </Suspense>
  );
}
