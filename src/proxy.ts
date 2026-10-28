import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookie";

const PUBLIC_PATHS = [
  "/login",
  "/sesi-berakhir",
  "/akses-ditolak",
  "/pemeliharaan",
  "/galat",
  "/api/health",
];

const isDev = process.env.NODE_ENV !== "production";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  ...(isDev
    ? {}
    : { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }),
};

function secure<T extends NextResponse>(response: T) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS))
    response.headers.set(name, value);
  return response;
}

function matches(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.MAINTENANCE_MODE === "true" &&
    !matches(pathname, "/pemeliharaan") &&
    !matches(pathname, "/api/health")
  ) {
    return secure(
      NextResponse.rewrite(new URL("/pemeliharaan", request.url), {
        status: 503,
      }),
    );
  }

  if (PUBLIC_PATHS.some((path) => matches(pathname, path)))
    return secure(NextResponse.next());
  if (request.cookies.has(SESSION_COOKIE)) return secure(NextResponse.next());
  return secure(NextResponse.redirect(new URL("/login", request.url)));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|favicon.ico|brand/|errors/).*)",
  ],
};
