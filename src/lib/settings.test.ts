import { describe, expect, it } from "vitest";
import {
  dayOfWeek,
  durationLabel,
  minutesToTime,
  timeToMinutes,
} from "./settings";

describe("timeToMinutes", () => {
  it("membaca format JJ:MM", () => {
    expect(timeToMinutes("07:30")).toBe(450);
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("menolak format yang salah", () => {
    expect(timeToMinutes("7:30")).toBeNaN();
    expect(timeToMinutes("24:00")).toBeNaN();
    expect(timeToMinutes("10:60")).toBeNaN();
    expect(timeToMinutes("")).toBeNaN();
  });
});

describe("minutesToTime", () => {
  it("menulis menit sebagai JJ:MM", () => {
    expect(minutesToTime(1080)).toBe("18:00");
    expect(minutesToTime(65)).toBe("01:05");
  });
});

describe("dayOfWeek", () => {
  it("mengembalikan 0 untuk Minggu dan 1 untuk Senin", () => {
    expect(dayOfWeek("2026-10-25")).toBe(0);
    expect(dayOfWeek("2026-10-26")).toBe(1);
  });
});

describe("durationLabel", () => {
  it("menulis menit atau jam", () => {
    expect(durationLabel(30)).toBe("30 menit");
    expect(durationLabel(1440)).toBe("24 jam");
  });
});
