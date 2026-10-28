"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import type { Permission } from "@/lib/permissions";
import { isActive, isGroup, navFor } from "./nav-config";

function NavPending() {
  const { pending } = useLinkStatus();
  return (
    <span className={cx("tab-pending", pending && "on")} aria-hidden="true" />
  );
}

export function TopNav({
  permissions,
  badges = {},
}: {
  permissions: Permission[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const items = navFor(permissions);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!openKey) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`[data-nav-group="${openKey}"]`)) setOpenKey(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenKey(null);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  return (
    <nav className="navbar" aria-label="Menu utama">
      <div className="wrap navbar-in">
        <div className="nav">
          {items.map((item) => {
            const Icon = item.icon;
            if (isGroup(item)) {
              const active = item.children.some((child) =>
                isActive(pathname, child.href),
              );
              const open = openKey === item.key;
              return (
                <div
                  key={item.key}
                  className="nav-group"
                  data-nav-group={item.key}
                >
                  <button
                    type="button"
                    className={cx("tab", active && "active")}
                    aria-haspopup="true"
                    aria-expanded={open}
                    onClick={() => setOpenKey(open ? null : item.key)}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                    <ChevronDown className="caret" aria-hidden="true" />
                  </button>
                  {open && (
                    <div className="nav-drop">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cx(childActive && "active")}
                            aria-current={childActive ? "page" : undefined}
                            onClick={() => setOpenKey(null)}
                          >
                            <ChildIcon aria-hidden="true" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx("tab", active && "active")}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpenKey(null)}
              >
                <Icon aria-hidden="true" />
                {item.label}
                {badges[item.href] ? (
                  <span className="num">{badges[item.href]}</span>
                ) : null}
                <NavPending />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
