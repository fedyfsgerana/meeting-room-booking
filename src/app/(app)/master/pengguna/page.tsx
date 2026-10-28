import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePagePermission } from "@/backend/auth/guard";
import { listUsers } from "@/backend/users/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { UsersManager } from "@/frontend/components/users/users-manager";

export const metadata: Metadata = { title: "Pengguna" };

async function PenggunaContent() {
  const me = await requirePagePermission("users.view");
  const users = await listUsers();
  return (
    <UsersManager
      users={users}
      currentUserId={me.id}
      can={{
        create: me.permissions.includes("users.create"),
        update: me.permissions.includes("users.update"),
        delete: me.permissions.includes("users.delete"),
        resetPassword: me.permissions.includes("users.reset_password"),
        deactivate: me.permissions.includes("users.deactivate"),
      }}
    />
  );
}

export default function PenggunaPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PenggunaContent />
    </Suspense>
  );
}
