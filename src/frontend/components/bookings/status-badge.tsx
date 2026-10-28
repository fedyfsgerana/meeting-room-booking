import { Badge } from "@/frontend/components/ui/badge";
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_TONE,
  type BookingStatus,
} from "@/lib/bookings";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge tone={BOOKING_STATUS_TONE[status]}>
      {BOOKING_STATUS_LABEL[status]}
    </Badge>
  );
}
