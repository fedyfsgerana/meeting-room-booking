import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/frontend/components/brand/brand-logo";
import { APP_NAME } from "@/lib/app-info";
import { AppFooter } from "./app-footer";
import { ScrollTopButton } from "./scroll-top-button";

type AppShellProps = {
  notifications: ReactNode;
  userMenu: ReactNode;
  nav: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
};

export function AppShell({
  notifications,
  userMenu,
  nav,
  bottomNav,
  children,
}: AppShellProps) {
  return (
    <div className="app">
      <header className="app-header">
        <div className="topbar">
          <div className="wrap topbar-in">
            <Link href="/" aria-label={`${APP_NAME}, ke Beranda`}>
              <BrandLogo animated />
            </Link>
            <div className="topbar-r">
              {notifications}
              {userMenu}
            </div>
          </div>
        </div>
        {nav}
      </header>
      <main className="wrap app-main">{children}</main>
      <AppFooter />
      <ScrollTopButton />
      {bottomNav}
    </div>
  );
}

export function UserMenuPlaceholder() {
  return <span className="sk sk-avatar" aria-hidden="true" />;
}

export function NavPlaceholder() {
  return (
    <nav className="navbar" aria-hidden="true">
      <div className="wrap navbar-in" />
    </nav>
  );
}
