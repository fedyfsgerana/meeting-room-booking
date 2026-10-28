import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getPicPerson, listPicRoomOptions } from "@/backend/rooms/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { AssignmentForm } from "@/frontend/components/master/assignment-form";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Ubah Penanggung Jawab Ruang" };

type Props = { params: Promise<{ id: string }> };

async function Content({ params }: Props) {
  await requirePagePermission("pic.update");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [current, targets] = await Promise.all([
    getPicPerson(id),
    listPicRoomOptions(),
  ]);
  if (!current) notFound();
  return <AssignmentForm kind="pic" current={current} targets={targets} />;
}

export default function Page({ params }: Props) {
  return (
    <>
      <PageHead
        title="Ubah Penanggung Jawab Ruang"
        description="Perbarui ruang yang dipegang."
        actions={
          <ButtonLink href="/master/penanggung-jawab-ruang" icon={ArrowLeft}>
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
