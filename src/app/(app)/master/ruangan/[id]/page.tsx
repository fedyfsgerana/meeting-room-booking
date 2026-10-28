import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import {
  listDepartmentOptions,
  toDepartmentOptions,
} from "@/backend/departments/queries";
import { getRoom } from "@/backend/rooms/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { RoomForm } from "@/frontend/components/rooms/room-form";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Ubah ruangan" };

type UbahRuanganPageProps = { params: Promise<{ id: string }> };

async function UbahRuanganContent({ params }: UbahRuanganPageProps) {
  await requirePagePermission("rooms.update");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [room, departments] = await Promise.all([
    getRoom(id),
    listDepartmentOptions(),
  ]);
  if (!room) notFound();
  return (
    <RoomForm room={room} departments={toDepartmentOptions(departments)} />
  );
}

export default function UbahRuanganPage({ params }: UbahRuanganPageProps) {
  return (
    <>
      <PageHead
        title="Ubah ruangan"
        description="Perbarui data ruang meeting."
        actions={
          <ButtonLink href="/master/ruangan" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <UbahRuanganContent params={params} />
      </Suspense>
    </>
  );
}
