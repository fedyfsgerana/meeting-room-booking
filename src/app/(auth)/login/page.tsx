import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { LoginForm } from "@/frontend/components/auth/login-form";
import { BrandMark } from "@/frontend/components/brand/brand-logo";
import { APP_VERSION, DEVELOPER_NAME, COPYRIGHT_YEAR } from "@/lib/app-info";
import { REMEMBER_COOKIE } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Masuk" };

async function RememberedLoginForm() {
  const remembered = (await cookies()).get(REMEMBER_COOKIE)?.value;
  return <LoginForm rememberedEmail={remembered} />;
}

export default function LoginPage() {
  return (
    <main className="login">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-main">
        <div className="login-brand">
          <BrandMark animated />
          <div className="login-word">
            <b>Meeting Room</b>
            <small>Booking</small>
          </div>
        </div>
        <Suspense fallback={<LoginForm />}>
          <RememberedLoginForm />
        </Suspense>
        <p className="login-meta">
          © {COPYRIGHT_YEAR} {DEVELOPER_NAME} · Versi {APP_VERSION}
        </p>
      </div>
    </main>
  );
}
