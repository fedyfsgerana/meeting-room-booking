import { Suspense, type ReactNode } from "react";
import {
  AppShell,
  NavPlaceholder,
  UserMenuPlaceholder,
} from "@/frontend/components/layout/app-shell";
import { NavigationProgress } from "@/frontend/components/layout/navigation-progress";
import { NotificationPlaceholder } from "@/frontend/components/layout/notification-bell";
import {
  SessionBottomNav,
  SessionNotifications,
  SessionTopNav,
  SessionUserMenu,
} from "@/frontend/components/layout/session-slots";
import { StatusProvider } from "@/frontend/components/ui/status-modal";

export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <StatusProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <AppShell
        notifications={
          <Suspense fallback={<NotificationPlaceholder />}>
            <SessionNotifications />
          </Suspense>
        }
        userMenu={
          <Suspense fallback={<UserMenuPlaceholder />}>
            <SessionUserMenu />
          </Suspense>
        }
        nav={
          <Suspense fallback={<NavPlaceholder />}>
            <SessionTopNav />
          </Suspense>
        }
        bottomNav={
          <Suspense fallback={null}>
            <SessionBottomNav />
          </Suspense>
        }
      >
        {children}
      </AppShell>
    </StatusProvider>
  );
}
