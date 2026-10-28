import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/backend/auth/session";
import { ChangePasswordForm } from "@/frontend/components/auth/change-password-form";
import { BrandMark } from "@/frontend/components/brand/brand-logo";
import { APP_VERSION, DEVELOPER_NAME, COPYRIGHT_YEAR } from "@/lib/app-info";

export const metadata: Metadata = { title: "Ganti password" };

async function Content() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ChangePasswordForm forced={user.mustChangePassword} />;
}

export default function GantiPasswordPage() {
  return (
    <main className="login">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-main">
        <div className="login-brand">
          <BrandMark />
          <div className="login-word">
            <b>Meeting Room</b>
            <small>Booking</small>
          </div>
        </div>
        <Suspense fallback={null}>
          <Content />
        </Suspense>
        <p className="login-meta">
          © {COPYRIGHT_YEAR} {DEVELOPER_NAME} · Versi {APP_VERSION}
        </p>
      </div>
    </main>
  );
}
