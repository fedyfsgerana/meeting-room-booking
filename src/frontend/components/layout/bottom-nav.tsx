"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu } from "lucide-react";
import { cx } from "@/lib/cx";
import type { Permission } from "@/lib/permissions";
import {
  MOBILE_MAIN,
  isActive,
  isGroup,
  navFor,
  type NavLink,
} from "./nav-config";

export function BottomNav({
  permissions,
  badges = {},
}: {
  permissions: Permission[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const items = navFor(permissions);
  const mainLinks = items.filter(
    (item): item is NavLink =>
      !isGroup(item) && MOBILE_MAIN.includes(item.href),
  );
  const otherLinks = items.filter(
    (item): item is NavLink =>
      !isGroup(item) && !MOBILE_MAIN.includes(item.href),
  );
  const moreGroups = [
    ...items
      .filter(isGroup)
      .map((group) => ({ title: group.label, links: group.children })),
    ...(otherLinks.length ? [{ title: "Sistem", links: otherLinks }] : []),
  ];
  const moreActive = moreGroups.some((group) =>
    group.links.some((link) => isActive(pathname, link.href)),
  );

  return (
    <>
      <nav className="bottom-nav" aria-label="Menu utama">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cx(active && "active")}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              {link.short ?? link.label}
              {badges[link.href] ? (
                <span className="num">{badges[link.href]}</span>
              ) : null}
            </Link>
          );
        })}
        {moreGroups.length > 0 && (
          <button
            type="button"
            className={cx(moreActive && "active")}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Menu aria-hidden="true" />
            Lainnya
          </button>
        )}
      </nav>
      {open &&
        createPortal(
          <div
            className="backdrop"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              className="modal sheet-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Menu lainnya"
            >
              <div className="sheet-handle" aria-hidden="true" />
              <div className="sheet">
                {moreGroups.map((group) => (
                  <div key={group.title}>
                    <h3>{group.title}</h3>
                    <div className="sheet-list">
                      {group.links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(pathname, link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={cx(active && "active")}
                            aria-current={active ? "page" : undefined}
                            onClick={() => setOpen(false)}
                          >
                            <Icon aria-hidden="true" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
