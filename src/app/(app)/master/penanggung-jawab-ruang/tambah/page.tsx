import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { listPicRoomOptions } from "@/backend/rooms/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { AssignmentForm } from "@/frontend/components/master/assignment-form";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Tambah Penanggung Jawab Ruang" };

async function Content() {
  await requirePagePermission("pic.create");
  const targets = await listPicRoomOptions();
  return <AssignmentForm kind="pic" current={null} targets={targets} />;
}

export default function Page() {
  return (
    <>
      <PageHead
        title="Tambah Penanggung Jawab Ruang"
        description="Pilih pengguna lalu ruang yang dipegangnya."
        actions={
          <ButtonLink href="/master/penanggung-jawab-ruang" icon={ArrowLeft}>
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
