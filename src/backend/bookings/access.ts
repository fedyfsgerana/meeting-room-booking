import "server-only";
import type { SessionUser } from "@/backend/auth/session";
import type { BookingDetail } from "./queries";

export function canViewBooking(user: SessionUser, booking: BookingDetail) {
  return (
    booking.requesterId === user.id ||
    user.permissions.includes("booking.manage") ||
    user.permissions.includes("approve_dept.view") ||
    user.permissions.includes("approve_room.view")
  );
}
