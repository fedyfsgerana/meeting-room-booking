import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { listAccessGroups } from "@/backend/access/queries";
import { requirePagePermission } from "@/backend/auth/guard";
import { AccessTable } from "@/frontend/components/access/access-table";
import { Can } from "@/frontend/components/auth/can";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Hak akses" };

async function HakAksesContent() {
  const me = await requirePagePermission("access.view");
  const groups = await listAccessGroups();
  return (
    <AccessTable
      groups={groups}
      canUpdate={me.permissions.includes("access.update")}
      canDelete={me.permissions.includes("access.delete")}
    />
  );
}

export default function HakAksesPage() {
  return (
    <>
      <PageHead
        title="Hak akses"
        description="Atur menu dan aksi untuk setiap hak akses. Setiap pengguna memakai satu hak akses."
        actions={
          <Can permission="access.create">
            <ButtonLink
              href="/master/hak-akses/tambah"
              variant="primary"
              icon={Plus}
            >
              Tambah hak akses
            </ButtonLink>
          </Can>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} />}>
        <HakAksesContent />
      </Suspense>
    </>
  );
}
