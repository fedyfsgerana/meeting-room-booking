import { describe, expect, it } from "vitest";
import { formatLongDate } from "./format";

describe("formatLongDate", () => {
  it("menulis tanggal panjang bahasa Indonesia tanpa bergeser hari", () => {
    expect(formatLongDate("2026-12-24")).toBe("Kamis, 24 Desember 2026");
    expect(formatLongDate("2026-01-01")).toBe("Kamis, 1 Januari 2026");
  });
});
