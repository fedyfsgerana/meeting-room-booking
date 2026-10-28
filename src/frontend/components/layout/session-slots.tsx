import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { countApprovals } from "@/backend/approvals/queries";
import { getSessionUser, type SessionUser } from "@/backend/auth/session";
import { listNotifications } from "@/backend/notifications/queries";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { BottomNav } from "./bottom-nav";
import { NotificationBell } from "./notification-bell";
import { WelcomeNotice } from "./welcome-notice";
import { TopNav } from "./top-nav";
import { UserMenu } from "./user-menu";

export async function SessionUserMenu() {
  const user = await getSessionUser();
  if (!user)
    redirect(
      (await cookies()).has(SESSION_COOKIE) ? "/sesi-berakhir" : "/login",
    );
  return (
    <>
      <UserMenu user={user} />
      <WelcomeNotice name={user.name} accessName={user.access} />
    </>
  );
}

const navBadges = cache(
  async (user: SessionUser): Promise<Record<string, number>> => {
    const counts = await countApprovals(user);
    const total = Object.values(counts).reduce(
      (sum, count) => sum + (count ?? 0),
      0,
    );
    return total ? { "/persetujuan": total } : {};
  },
);

export async function SessionTopNav() {
  const user = await getSessionUser();
  if (!user) return null;
  return (
    <TopNav permissions={user.permissions} badges={await navBadges(user)} />
  );
}

export async function SessionBottomNav() {
  const user = await getSessionUser();
  if (!user) return null;
  return (
    <BottomNav permissions={user.permissions} badges={await navBadges(user)} />
  );
}

export async function SessionNotifications() {
  const user = await getSessionUser();
  if (!user) return null;
  return <NotificationBell initial={await listNotifications(user.id)} />;
}
