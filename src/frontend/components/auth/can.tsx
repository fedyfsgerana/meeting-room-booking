import { Suspense, type ReactNode } from "react";
import { getSessionUser } from "@/backend/auth/session";
import type { Permission } from "@/lib/permissions";

async function Gate({ permission, children }: { permission: Permission; children: ReactNode }) {
  const user = await getSessionUser();
  return user?.permissions.includes(permission) ? children : null;
}

export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Gate permission={permission}>{children}</Gate>
    </Suspense>
  );
}
