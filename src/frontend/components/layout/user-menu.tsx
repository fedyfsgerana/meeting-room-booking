"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  ChevronDown,
  KeyRound,
  Laptop,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/backend/auth/actions";
import type { SessionUser } from "@/backend/auth/session";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { avatarTone, initials } from "@/lib/avatar";
import { cx } from "@/lib/cx";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

const THEME_OPTIONS: Array<[Theme, string, LucideIcon]> = [
  ["system", "Sistem", Laptop],
  ["light", "Terang", Sun],
  ["dark", "Gelap", Moon],
];

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setTheme(readTheme());
    setOpen(!open);
  };

  const chooseTheme = (value: Theme) => {
    applyTheme(value);
    setTheme(value);
  };

  const tone = avatarTone(user.name);

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-btn"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className={cx("avatar", "avatar-solid", tone)}>
          {initials(user.name)}
        </span>
        <span className="u-text">
          <span className="u-name">{user.name}</span>
          <span className="u-role">{user.access}</span>
        </span>
        <ChevronDown className="u-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="account" role="dialog" aria-label="Akun">
          <div className="acc-head">
            <span className={cx("avatar", "avatar-solid", tone)}>
              {initials(user.name)}
            </span>
            <div>
              <div className="who">{user.name}</div>
              <div className="what">{user.email}</div>
            </div>
          </div>
          <div className="sep" />
          <ul className="acc-meta">
            <li title="Jabatan">
              <Briefcase aria-hidden="true" />
              <span className="sr-only">Jabatan: </span>
              <span>{user.job}</span>
            </li>
            <li title="Departemen">
              <Building2 aria-hidden="true" />
              <span className="sr-only">Departemen: </span>
              <span>{user.department}</span>
            </li>
            <li title="Akses">
              <ShieldCheck aria-hidden="true" />
              <span className="sr-only">Akses: </span>
              <span>{user.access}</span>
            </li>
          </ul>
          <div className="sep" />
          <div className="theme-seg" role="group" aria-label="Tema tampilan">
            {THEME_OPTIONS.map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => chooseTheme(value)}
              >
                <Icon aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <div className="sep" />
          <Link
            href="/ganti-password"
            className="acc-link"
            onClick={() => setOpen(false)}
          >
            <KeyRound aria-hidden="true" />
            Ganti password
          </Link>
          <button
            type="button"
            className="logout"
            onClick={() => {
              setOpen(false);
              setConfirmLogout(true);
            }}
          >
            <LogOut aria-hidden="true" />
            Keluar
          </button>
        </div>
      )}
      {confirmLogout && (
        <ConfirmDialog
          title="Keluar dari aplikasi?"
          description="Sesi di perangkat ini diakhiri. Anda perlu masuk lagi untuk memakai aplikasi."
          confirmLabel="Keluar"
          icon={LogOut}
          tone="danger"
          pending={pending}
          onConfirm={() => startTransition(() => logoutAction())}
          onClose={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}
