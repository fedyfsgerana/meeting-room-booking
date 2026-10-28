export const ACTIVITY_ACTIONS = [
  "login",
  "login_failed",
  "logout",
  "create",
  "update",
  "delete",
  "activate",
  "deactivate",
  "reset_password",
  "sync",
  "submit",
  "reschedule",
  "cancel",
  "approve",
  "reject",
  "check",
  "restore",
  "change_password",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_MODULES = [
  "auth",
  "rooms",
  "approvers",
  "pic",
  "users",
  "access",
  "settings",
  "departments",
  "bookings",
  "approvals",
] as const;

export type ActivityModule = (typeof ACTIVITY_MODULES)[number];

export const ACTIVITY_ACTION_LABEL: Record<ActivityAction, string> = {
  login: "Login",
  login_failed: "Login gagal",
  logout: "Logout",
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
  activate: "Aktifkan",
  deactivate: "Nonaktifkan",
  reset_password: "Atur ulang password",
  sync: "Sinkronisasi",
  submit: "Ajukan",
  reschedule: "Jadwal ulang",
  cancel: "Batalkan",
  approve: "Setujui",
  reject: "Tolak",
  check: "Ruang siap",
  restore: "Kembalikan",
  change_password: "Ganti password",
};

export const ACTIVITY_ACTION_TONE: Record<
  ActivityAction,
  "ok" | "bad" | "warn" | "info" | "gray"
> = {
  login: "ok",
  login_failed: "bad",
  logout: "gray",
  create: "ok",
  update: "info",
  delete: "bad",
  activate: "ok",
  deactivate: "bad",
  reset_password: "warn",
  sync: "info",
  submit: "info",
  reschedule: "warn",
  cancel: "bad",
  approve: "ok",
  reject: "bad",
  check: "ok",
  restore: "warn",
  change_password: "warn",
};

export const ACTIVITY_MODULE_LABEL: Record<ActivityModule, string> = {
  auth: "Login dan sesi",
  rooms: "Ruangan",
  approvers: "Penyetuju",
  pic: "Penanggung Jawab Ruang",
  users: "Pengguna",
  access: "Hak akses",
  settings: "Aturan booking",
  departments: "Departemen",
  bookings: "Booking",
  approvals: "Persetujuan",
};

export const RESTORABLE_MODULES = new Set<ActivityModule>([
  "rooms",
  "departments",
  "approvers",
  "pic",
  "users",
  "access",
  "settings",
]);

export function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "-";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Browser lain";
  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad/.test(userAgent)
        ? "iOS"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Sistem lain";
  return `${browser} · ${system}`;
}
