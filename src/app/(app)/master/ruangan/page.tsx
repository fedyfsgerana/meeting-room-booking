import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePagePermission } from "@/backend/auth/guard";
import { listRooms } from "@/backend/rooms/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { RoomsManager } from "@/frontend/components/rooms/rooms-manager";

export const metadata: Metadata = { title: "Ruangan" };

async function RoomsContent() {
  const me = await requirePagePermission("rooms.view");
  const rooms = await listRooms();
  return (
    <RoomsManager
      rooms={rooms}
      canCreate={me.permissions.includes("rooms.create")}
      canUpdate={me.permissions.includes("rooms.update")}
      canDelete={me.permissions.includes("rooms.delete")}
    />
  );
}

export default function RuanganPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoomsContent />
    </Suspense>
  );
}
