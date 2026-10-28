export const ROOM_STATUSES = ["active", "repair", "off"] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  active: "Aktif",
  repair: "Perbaikan",
  off: "Nonaktif",
};

export const ROOM_FACILITIES = [
  { key: "tv", label: "Layar TV" },
  { key: "projector", label: "Proyektor" },
  { key: "vc", label: "Teleconference" },
  { key: "sound", label: "Sound system" },
  { key: "board", label: "Papan tulis" },
  { key: "stage", label: "Panggung" },
] as const;

export type RoomFacility = (typeof ROOM_FACILITIES)[number]["key"];

export const ROOM_FACILITY_KEYS = ROOM_FACILITIES.map(
  (facility) => facility.key,
) as [RoomFacility, ...RoomFacility[]];

export function facilityLabel(key: string) {
  return ROOM_FACILITIES.find((facility) => facility.key === key)?.label ?? key;
}

export function roomInitial(name: string) {
  const base = name.replace(/^ruang(an)?\s+/i, "").trim() || name;
  return base.slice(0, 2).replace(/^./, (char) => char.toUpperCase());
}
