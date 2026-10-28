"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/backend/activity/log";
import { settingsSnapshot } from "@/backend/activity/snapshots";
import { hasPermission } from "@/backend/auth/guard";
import { db } from "@/backend/db/client";
import { isUniqueViolation } from "@/backend/db/errors";
import { appSettings, holidays } from "@/backend/db/schema";
import { fieldErrorsFrom, type ActionResult } from "@/lib/action-result";
import { INVALID_REQUEST, isId } from "@/lib/args";
import { deleteReasonSchema } from "@/lib/schemas/reason";
import {
  holidaySchema,
  settingsSchema,
  type HolidayField,
  type HolidayInput,
  type SettingsField,
  type SettingsInput,
} from "@/lib/schemas/settings";

const PATH = "/pengaturan/aturan-booking";
const FORBIDDEN = {
  ok: false as const,
  message: "Anda tidak punya akses untuk mengubah pengaturan.",
};

export async function updateSettingsAction(
  input: SettingsInput,
): Promise<ActionResult<SettingsField>> {
  if (!(await hasPermission("settings.update"))) return FORBIDDEN;

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom<SettingsField>(parsed.error.issues),
    };

  const before = await settingsSnapshot();
  await db
    .insert(appSettings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: appSettings.id, set: parsed.data });

  await logActivity({
    action: "update",
    module: "settings",
    targetLabel: "Aturan booking",
    before,
    after: await settingsSnapshot(),
  });
  revalidatePath(PATH);
  return { ok: true, message: "Pengaturan disimpan." };
}

export async function addHolidayAction(input: HolidayInput): Promise<ActionResult<HolidayField>> {
  if (!(await hasPermission("settings.update"))) return FORBIDDEN;

  const parsed = holidaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom<HolidayField>(parsed.error.issues) };

  try {
    const [row] = await db.insert(holidays).values(parsed.data).returning({ id: holidays.id });
    await logActivity({
      action: "create",
      module: "settings",
      targetId: row.id,
      targetLabel: `Hari libur: ${parsed.data.name}`,
      detail: parsed.data.date,
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, fieldErrors: { date: "Tanggal ini sudah terdaftar sebagai hari libur." } };
    throw error;
  }

  revalidatePath(PATH);
  return { ok: true, message: "Hari libur ditambahkan." };
}

export async function deleteHolidayAction(id: number, reason: string): Promise<ActionResult<"reason">> {
  if (!isId(id)) return INVALID_REQUEST;
  if (!(await hasPermission("settings.update"))) return FORBIDDEN;
  const reasonCheck = deleteReasonSchema.safeParse(reason);
  if (!reasonCheck.success) return { ok: false, fieldErrors: { reason: reasonCheck.error.issues[0]?.message } };

  const deleted = await db
    .delete(holidays)
    .where(eq(holidays.id, id))
    .returning({ date: holidays.date, name: holidays.name });
  if (!deleted.length) return { ok: false, message: "Hari libur tidak ditemukan. Muat ulang halaman." };

  await logActivity({
    action: "delete",
    module: "settings",
    targetId: id,
    targetLabel: `Hari libur: ${deleted[0].name}`,
    detail: `${deleted[0].date} · ${reasonCheck.data}`,
  });
  revalidatePath(PATH);
  return { ok: true, message: "Hari libur dihapus." };
}
