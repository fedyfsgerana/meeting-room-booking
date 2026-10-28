import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, toDateTime, zonedNow } from "./time";

describe("zonedNow", () => {
  it("memakai tanggal dan jam WIB, bukan UTC", () => {
    expect(zonedNow(new Date("2026-10-23T17:30:00Z"))).toEqual({ date: "2026-10-24", minute: 30 });
  });

  it("menghitung menit sejak tengah malam", () => {
    expect(zonedNow(new Date("2026-10-23T03:15:00Z"))).toEqual({ date: "2026-10-23", minute: 615 });
  });
});

describe("toDateTime", () => {
  it("mengubah tanggal dan menit WIB menjadi waktu UTC", () => {
    expect(toDateTime("2026-10-24", 570).toISOString()).toBe("2026-10-24T02:30:00.000Z");
  });
});

describe("formatClock dan formatDuration", () => {
  it("menulis jam dengan titik", () => {
    expect(formatClock(570)).toBe("09.30");
    expect(formatClock(1080)).toBe("18.00");
  });

  it("menulis durasi dalam jam dan menit", () => {
    expect(formatDuration(45)).toBe("45 menit");
    expect(formatDuration(120)).toBe("2 jam");
    expect(formatDuration(90)).toBe("1 jam 30 menit");
  });
});
