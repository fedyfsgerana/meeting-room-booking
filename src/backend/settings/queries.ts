import "server-only";
import { asc, eq, gte } from "drizzle-orm";
import { db } from "@/backend/db/client";
import { appSettings, holidays } from "@/backend/db/schema";
import {
  DAY_LABELS,
  DEFAULT_SETTINGS,
  dayOfWeek,
  type AppSettings,
} from "@/lib/settings";

export async function getSettings(): Promise<AppSettings> {
  const [row] = await db
    .select({
      draftTimeoutMinutes: appSettings.draftTimeoutMinutes,
      operationalDays: appSettings.operationalDays,
      openMinute: appSettings.openMinute,
      closeMinute: appSettings.closeMinute,
    })
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);
  return row ?? DEFAULT_SETTINGS;
}

export async function listHolidays(fromDate?: string) {
  return db
    .select({ id: holidays.id, date: holidays.date, name: holidays.name })
    .from(holidays)
    .where(fromDate ? gte(holidays.date, fromDate) : undefined)
    .orderBy(asc(holidays.date));
}

export type HolidayRow = Awaited<ReturnType<typeof listHolidays>>[number];

export async function closedReason(date: string, settings?: AppSettings) {
  const [holiday] = await db
    .select({ name: holidays.name })
    .from(holidays)
    .where(eq(holidays.date, date))
    .limit(1);
  if (holiday) return holiday.name;
  const current = settings ?? (await getSettings());
  const day = dayOfWeek(date);
  if (!current.operationalDays.includes(day))
    return `Hari ${DAY_LABELS[day]} bukan hari operasional`;
  return null;
}
