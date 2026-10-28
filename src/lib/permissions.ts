export const PERMISSION_COLUMNS = [
  { key: "view", label: "Lihat" },
  { key: "create", label: "Tambah" },
  { key: "update", label: "Ubah" },
  { key: "delete", label: "Hapus" },
] as const;

export type PermissionColumn = (typeof PERMISSION_COLUMNS)[number]["key"];

type MenuAction = { key: string; label: string; column?: PermissionColumn };

const CRUD = [
  { key: "view", label: "Lihat", column: "view" },
  { key: "create", label: "Tambah", column: "create" },
  { key: "update", label: "Ubah", column: "update" },
  { key: "delete", label: "Hapus", column: "delete" },
] as const satisfies readonly MenuAction[];

const APPROVE = [
  { key: "view", label: "Lihat", column: "view" },
  { key: "approve", label: "Setujui" },
  { key: "reject", label: "Tolak" },
] as const satisfies readonly MenuAction[];

export const PERMISSION_MENUS = [
  {
    key: "dashboard",
    label: "Beranda & Monitoring",
    description: "Timeline pemakaian dan status setiap ruang.",
    actions: [{ key: "view", label: "Lihat", column: "view" }],
  },
  {
    key: "booking",
    label: "Booking ruang",
    description: "Booking milik sendiri.",
    actions: [
      { key: "view", label: "Lihat", column: "view" },
      { key: "create", label: "Ajukan", column: "create" },
      { key: "update", label: "Jadwal ulang", column: "update" },
      { key: "delete", label: "Batalkan", column: "delete" },
      { key: "manage", label: "Kelola booking semua orang" },
    ],
  },
  {
    key: "approve_dept",
    label: "Persetujuan penyetuju",
    description: "Draft dari departemen yang ia setujui.",
    actions: APPROVE,
  },
  {
    key: "approve_room",
    label: "Cek penanggung jawab ruang",
    description: "Kesiapan ruang yang dipegang.",
    actions: APPROVE,
  },
  {
    key: "rooms",
    label: "Ruangan",
    description: "Master ruang meeting.",
    actions: CRUD,
  },
  {
    key: "departments",
    label: "Departemen",
    description: "Daftar departemen perusahaan.",
    actions: CRUD,
  },
  {
    key: "approvers",
    label: "Penyetuju",
    description: "Penyetuju setiap departemen.",
    actions: CRUD,
  },
  {
    key: "pic",
    label: "Penanggung Jawab Ruang",
    description: "Penanggung jawab setiap ruang.",
    actions: CRUD,
  },
  {
    key: "users",
    label: "Pengguna",
    description: "Akun yang bisa masuk ke aplikasi.",
    actions: [
      ...CRUD,
      { key: "reset_password", label: "Atur ulang password" },
      { key: "deactivate", label: "Nonaktifkan" },
    ],
  },
  {
    key: "access",
    label: "Hak akses",
    description: "Menu dan aksi setiap hak akses.",
    actions: CRUD,
  },
  {
    key: "settings",
    label: "Aturan booking",
    description: "Batas Draft, jam operasional, dan hari libur.",
    actions: [
      { key: "view", label: "Lihat", column: "view" },
      { key: "update", label: "Ubah", column: "update" },
    ],
  },
  {
    key: "activity",
    label: "Riwayat aktivitas",
    description: "Catatan login dan perubahan data.",
    actions: [
      { key: "view", label: "Lihat", column: "view" },
      { key: "restore", label: "Kembalikan data" },
    ],
  },
] as const satisfies readonly {
  key: string;
  label: string;
  description: string;
  actions: readonly MenuAction[];
}[];

type Menu = (typeof PERMISSION_MENUS)[number];

export type Permission = {
  [M in Menu as M["key"]]: `${M["key"]}.${M["actions"][number]["key"]}`;
}[Menu["key"]];

export const ALL_PERMISSIONS = PERMISSION_MENUS.flatMap((menu) =>
  menu.actions.map((action) => `${menu.key}.${action.key}` as Permission),
);

export const PERMISSION_LABEL = Object.fromEntries(
  PERMISSION_MENUS.flatMap((menu) =>
    menu.actions.map((action) => [
      `${menu.key}.${action.key}`,
      `${menu.label}: ${action.label}`,
    ]),
  ),
) as Record<Permission, string>;

export const PERMISSION_GROUPS = PERMISSION_MENUS.map((menu) => ({
  label: menu.label,
  items: menu.actions.map((action) => ({
    key: `${menu.key}.${action.key}` as Permission,
    label: action.label,
    description: menu.description,
  })),
}));

export function can(permissions: readonly string[], permission: Permission) {
  return permissions.includes(permission);
}

export function canAny(permissions: readonly string[], ...list: Permission[]) {
  return list.some((permission) => permissions.includes(permission));
}

export const ACCESS_DESCRIPTIONS = [
  "Karyawan yang memesan ruang meeting.",
  "Kepala departemen yang menyetujui Draft.",
  "Mengecek kesiapan ruang dan perlengkapan.",
  "Memantau pemakaian ruang tanpa memesan.",
  "Mengelola data ruangan, penyetuju, dan Penanggung Jawab Ruang.",
  "Mengelola akun pengguna dan hak aksesnya.",
  "Mengelola semua booking dan pengaturan aplikasi.",
  "Pengelola aplikasi, ruang, pengguna, dan akses.",
] as const;

export const ADMIN_GROUP_CODE = "admin";
