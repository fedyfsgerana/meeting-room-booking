import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/frontend/components/brand/brand-logo";
import { APP_VERSION, DEVELOPER_NAME, COPYRIGHT_YEAR } from "@/lib/app-info";
import { cx } from "@/lib/cx";
import { ERROR_CONTENT, type ErrorCode } from "@/lib/errors";

type ErrorScreenProps = {
  type: ErrorCode;
  actions?: ReactNode;
  meta?: ReactNode;
  overlay?: boolean;
};

export function ErrorScreen({
  type,
  actions,
  meta,
  overlay = false,
}: ErrorScreenProps) {
  const content = ERROR_CONTENT[type];

  return (
    <div
      className={cx("err-page", overlay && "err-overlay")}
      role={overlay ? "alertdialog" : undefined}
      aria-labelledby="err-title"
    >
      <div className="err-glow" aria-hidden="true" />
      <header className="err-head">
        <Link
          href="/"
          className="err-brand"
          aria-label="Meeting Room Booking, ke Beranda"
        >
          <BrandMark />
          <span>
            <b>Meeting Room</b>
            <small>Booking</small>
          </span>
        </Link>
      </header>
      <main className="err-main">
        <div
          className={cx("err-code", content.code.length > 3 && "is-word")}
          aria-hidden="true"
        >
          {content.code}
        </div>
        <h1 id="err-title">{content.title}</h1>
        <p className="err-desc">{content.description}</p>
        {actions && <div className="err-actions">{actions}</div>}
        {meta && <p className="err-meta">{meta}</p>}
      </main>
      <footer className="err-foot">
        © {COPYRIGHT_YEAR} {DEVELOPER_NAME} · Versi {APP_VERSION}
      </footer>
    </div>
  );
}
