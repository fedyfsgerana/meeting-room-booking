import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { countRoomsWithoutPic, listPicPeople } from "@/backend/rooms/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { Can } from "@/frontend/components/auth/can";
import { AssignmentTable } from "@/frontend/components/master/assignment-table";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { FormAlert } from "@/frontend/components/ui/form-alert";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Penanggung Jawab Ruang" };

async function Content() {
  const me = await requirePagePermission("pic.view");
  const [rows, missing] = await Promise.all([
    listPicPeople(),
    countRoomsWithoutPic(),
  ]);
  return (
    <>
      <FormAlert
        tone="warning"
        message={
          missing
            ? `${missing} ruang belum punya Penanggung Jawab Ruang, sehingga booking ruang itu tidak bisa dicek.`
            : undefined
        }
      />
      <AssignmentTable
        kind="pic"
        rows={rows}
        canUpdate={me.permissions.includes("pic.update")}
        canDelete={me.permissions.includes("pic.delete")}
      />
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHead
        title="Penanggung Jawab Ruang"
        description="Penanggung Jawab Ruang yang mengecek kesiapan ruang setelah booking disetujui penyetuju."
        actions={
          <Can permission="pic.create">
            <ButtonLink
              href="/master/penanggung-jawab-ruang/tambah"
              variant="primary"
              icon={Plus}
            >
              Tambah Penanggung Jawab Ruang
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
