export const APPROVAL_MODES = ["approver", "pic"] as const;

export type ApprovalMode = (typeof APPROVAL_MODES)[number];

export const APPROVAL_MODE_PERMISSION = {
  approver: "approve_dept.view",
  pic: "approve_room.view",
} as const;

export const APPROVAL_MODE_LABEL: Record<ApprovalMode, string> = {
  approver: "Penyetuju",
  pic: "Penanggung Jawab Ruang",
};

export const APPROVAL_MODE_DESCRIPTION: Record<ApprovalMode, string> = {
  approver:
    "Booking yang menunggu persetujuan penyetuju departemen. Draft batal otomatis bila tidak disetujui sampai batas waktunya.",
  pic: "Booking yang sudah disetujui penyetuju dan menunggu cek kesiapan ruang serta perlengkapan.",
};
