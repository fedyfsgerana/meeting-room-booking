const longDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatLongDate(date: string) {
  return longDate.format(new Date(`${date}T00:00:00Z`));
}

const shortDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTime = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

export function formatShortDate(date: string) {
  return shortDate.format(new Date(`${date}T00:00:00Z`));
}

export function formatDateTime(value: Date | string) {
  return dateTime
    .format(typeof value === "string" ? new Date(value) : value)
    .replace(":", ".");
}

export function formatRelative(value: Date | string, now: Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDateTime(date);
}
