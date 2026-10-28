export type AssignmentKind = "approver" | "pic";

export type AssignmentPerson = {
  id: number;
  name: string;
  job: string;
  active: boolean;
  items: Array<{ id: number; label: string }>;
};

export const ASSIGNMENT_TEXT = {
  approver: {
    path: "/master/penyetuju",
    person: "Penyetuju",
    item: "Departemen",
    itemLower: "departemen",
    unit: "penyetuju",
    removeTitle: "Hapus penyetuju?",
    removeDescription: (name: string) =>
      `${name} tidak lagi menjadi penyetuju di semua departemennya.`,
    emptyTitle: "Belum ada penyetuju",
  },
  pic: {
    path: "/master/penanggung-jawab-ruang",
    person: "Penanggung Jawab Ruang",
    item: "Ruang",
    itemLower: "ruang",
    unit: "orang",
    removeTitle: "Hapus Penanggung Jawab Ruang?",
    removeDescription: (name: string) =>
      `${name} dilepas dari semua ruang yang dipegangnya.`,
    emptyTitle: "Belum ada Penanggung Jawab Ruang",
  },
} as const;
