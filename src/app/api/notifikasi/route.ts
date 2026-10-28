import { peekSessionUser } from "@/backend/auth/session";
import { listNotifications } from "@/backend/notifications/queries";
import { takeRateLimit } from "@/backend/security/rate-limit";

export async function GET() {
  const user = await peekSessionUser();
  if (!user)
    return Response.json({ message: "Sesi berakhir." }, { status: 401 });
  const limit = takeRateLimit("notifications", user.id);
  if (!limit.allowed) {
    return Response.json(
      { message: "Terlalu banyak permintaan." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retrySeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }
  const feed = await listNotifications(user.id);
  return Response.json(feed, { headers: { "Cache-Control": "no-store" } });
}
