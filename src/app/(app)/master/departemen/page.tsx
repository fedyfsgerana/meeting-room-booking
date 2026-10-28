import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePagePermission } from "@/backend/auth/guard";
import { listDepartments } from "@/backend/departments/queries";
import { DepartmentsManager } from "@/frontend/components/departments/departments-manager";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";

export const metadata: Metadata = { title: "Departemen" };

async function DepartmentsContent() {
  const me = await requirePagePermission("departments.view");
  const departments = await listDepartments();
  return (
    <DepartmentsManager
      departments={departments}
      canCreate={me.permissions.includes("departments.create")}
      canUpdate={me.permissions.includes("departments.update")}
      canDelete={me.permissions.includes("departments.delete")}
    />
  );
}

export default function DepartemenPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DepartmentsContent />
    </Suspense>
  );
}
