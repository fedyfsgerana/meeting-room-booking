import "server-only";
import { redirect } from "next/navigation";
import type { Permission } from "@/lib/permissions";
import { getSessionUser } from "./session";

export async function requirePagePermission(permission: Permission) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/ganti-password");
  if (!user.permissions.includes(permission)) redirect("/akses-ditolak");
  return user;
}

export async function hasPermission(permission: Permission) {
  const user = await getSessionUser();
  return Boolean(user?.permissions.includes(permission));
}
