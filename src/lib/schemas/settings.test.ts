import { describe, expect, it } from "vitest";
import { settingsSchema, type SettingsInput } from "./settings";

const valid: SettingsInput = {
  draftTimeoutMinutes: "60",
  operationalDays: ["6", "1", "1"],
  openMinute: "07:00",
  closeMinute: "18:00",
};

describe("settingsSchema", () => {
  it("menerima pengaturan yang benar, hari diurutkan tanpa kembar", () => {
    const result = settingsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      draftTimeoutMinutes: 60,
      operationalDays: [1, 6],
      openMinute: 420,
      closeMinute: 1080,
    });
  });

  it("hanya menerima pilihan batas Draft yang tersedia", () => {
    expect(
      settingsSchema.safeParse({ ...valid, draftTimeoutMinutes: "45" }).success,
    ).toBe(false);
  });

  it("mewajibkan jam tutup setelah jam buka", () => {
    const result = settingsSchema.safeParse({ ...valid, closeMinute: "07:00" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["closeMinute"]);
  });

  it("mewajibkan minimal satu hari operasional", () => {
    expect(
      settingsSchema.safeParse({ ...valid, operationalDays: [] }).success,
    ).toBe(false);
  });
});
