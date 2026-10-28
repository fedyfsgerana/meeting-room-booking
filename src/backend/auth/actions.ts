"use server";

import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/backend/db/client";
import { users } from "@/backend/db/schema";
import { clientInfo, logActivity } from "@/backend/activity/log";
import { loginLockState } from "./lockout";
import { REMEMBER_COOKIE, WELCOME_COOKIE } from "@/lib/auth-cookie";
import { loginSchema, type LoginState } from "@/lib/schemas/auth";
import { hashPassword, verifyPassword } from "./password";
import { createSession, deleteCurrentSession, REMEMBER_DAYS } from "./session";
import { takeRateLimit } from "@/backend/security/rate-limit";

const INVALID_LOGIN = "Email atau password salah.";

let dummyHash: Promise<string> | undefined;

function getDummyHash() {
  dummyHash ??= hashPassword("meeting-room-booking-dummy-password");
  return dummyHash;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    remember: formData.get("remember") === "on",
  });

  const email = String(formData.get("email") ?? "").trim();
  const remember = formData.get("remember") === "on";

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "email" || field === "password") && !fieldErrors[field])
        fieldErrors[field] = issue.message;
    }
    return { fieldErrors, email, remember };
  }

  const { ipAddress } = await clientInfo();
  if (!takeRateLimit("login", ipAddress).allowed) {
    return {
      message:
        "Terlalu banyak percobaan login. Tunggu sebentar, lalu coba lagi.",
      email,
      remember,
    };
  }
  const lock = await loginLockState(parsed.data.email, ipAddress);
  if (lock.locked) {
    return {
      message: `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${lock.retryMinutes} menit.`,
      email,
      remember,
    };
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      passwordHash: users.passwordHash,
      active: users.active,
    })
    .from(users)
    .where(eq(sql`lower(${users.email})`, parsed.data.email))
    .limit(1);

  const valid = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    parsed.data.password,
  );

  if (!user || !valid) {
    await logActivity({
      action: "login_failed",
      module: "auth",
      actor: user ? { id: user.id, name: user.name } : null,
      targetLabel: parsed.data.email,
      detail: user ? "Password salah" : "Akun tidak ditemukan",
    });
    return { message: INVALID_LOGIN, email, remember };
  }
  if (!user.active) {
    await logActivity({
      action: "login_failed",
      module: "auth",
      actor: { id: user.id, name: user.name },
      targetLabel: parsed.data.email,
      detail: "Akun nonaktif",
    });
    return {
      message: "Akun Anda nonaktif. Hubungi administrator.",
      email,
      remember,
    };
  }

  await createSession(user.id, parsed.data.remember);
  await logActivity({
    action: "login",
    module: "auth",
    actor: { id: user.id, name: user.name },
    detail: parsed.data.remember ? "Dengan Ingat saya" : null,
  });
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  const jar = await cookies();
  jar.set(WELCOME_COOKIE, "1", { maxAge: 60, path: "/", sameSite: "lax" });
  if (parsed.data.remember) {
    jar.set(REMEMBER_COOKIE, parsed.data.email, {
      maxAge: REMEMBER_DAYS * 24 * 60 * 60,
      path: "/login",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    jar.delete({ name: REMEMBER_COOKIE, path: "/login" });
  }

  redirect("/");
}

export async function logoutAction() {
  await logActivity({ action: "logout", module: "auth" });
  await deleteCurrentSession();
  redirect("/login");
}
