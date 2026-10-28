export const DRAFT_TIMEOUT_OPTIONS = [
  30, 60, 120, 240, 480, 720, 1440,
] as const;

export const DAY_LABELS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export const DAY_SHORT = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
] as const;

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export type AppSettings = {
  draftTimeoutMinutes: number;
  operationalDays: number[];
  openMinute: number;
  closeMinute: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  draftTimeoutMinutes: 1440,
  operationalDays: [1, 2, 3, 4, 5, 6],
  openMinute: 420,
  closeMinute: 1080,
};

export function durationLabel(minutes: number) {
  return minutes < 60 ? `${minutes} menit` : `${minutes / 60} jam`;
}

export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return Number.NaN;
  return hours * 60 + minutes;
}

export function dayOfWeek(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
