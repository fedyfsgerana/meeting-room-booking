import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/backend/auth/guard";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import {
  listDepartmentOptions,
  toDepartmentOptions,
} from "@/backend/departments/queries";
import { RoomForm } from "@/frontend/components/rooms/room-form";
import { ButtonLink } from "@/frontend/components/ui/button-link";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Tambah ruangan" };

async function TambahRuanganContent() {
  await requirePagePermission("rooms.create");
  const departments = await listDepartmentOptions();
  return (
    <RoomForm room={null} departments={toDepartmentOptions(departments)} />
  );
}

export default function TambahRuanganPage() {
  return (
    <>
      <PageHead
        title="Tambah ruangan"
        description="Isi data ruang meeting baru."
        actions={
          <ButtonLink href="/master/ruangan" icon={ArrowLeft}>
            Kembali
          </ButtonLink>
        }
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <TambahRuanganContent />
      </Suspense>
    </>
  );
}
