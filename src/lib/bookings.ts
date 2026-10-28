export const BOOKING_STATUSES = [
  "draft",
  "pic",
  "approved",
  "done",
  "rejected",
  "cancelled",
  "expired",
  "rescheduled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ACTIVE_STATUSES: BookingStatus[] = ["draft", "pic", "approved"];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  draft: "Draft",
  pic: "Menunggu PJ Ruang",
  approved: "Disetujui",
  done: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Batal otomatis",
  rescheduled: "Dijadwalkan ulang",
};

export const BOOKING_STATUS_TONE: Record<
  BookingStatus,
  "warn" | "info" | "ok" | "gray" | "bad"
> = {
  draft: "warn",
  pic: "info",
  approved: "ok",
  done: "gray",
  rejected: "bad",
  cancelled: "bad",
  expired: "bad",
  rescheduled: "gray",
};

export const TELE_APPS = [
  "Google Meet",
  "Skype",
  "Zoom",
  "Cisco Webex",
  "Jitsi",
  "DingTalk Lite",
  "Microsoft Teams",
] as const;

export type BookingEventType =
  | "submitted"
  | "rescheduled"
  | "approved_dept"
  | "checked_room"
  | "finished"
  | "rejected"
  | "cancelled"
  | "expired";

export const BOOKING_EVENT_LABEL: Record<BookingEventType, string> = {
  submitted: "Diajukan",
  rescheduled: "Dijadwalkan ulang",
  approved_dept: "Disetujui penyetuju",
  checked_room: "Dicek Penanggung Jawab Ruang",
  finished: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Batal otomatis",
};
