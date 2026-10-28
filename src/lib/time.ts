export const APP_TIME_ZONE = "Asia/Jakarta";

const UTC_OFFSET = "+07:00";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function zonedNow(now: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function toDateTime(date: string, minute: number) {
  const hours = String(Math.floor(minute / 60)).padStart(2, "0");
  const minutes = String(minute % 60).padStart(2, "0");
  return new Date(`${date}T${hours}:${minutes}:00${UTC_OFFSET}`);
}

export function formatClock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}.${String(minute % 60).padStart(2, "0")}`;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} menit`;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}
