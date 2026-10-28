import { describe, expect, it } from "vitest";
import { originBack, originQuery } from "./back-link";

describe("tautan kembali", () => {
  it("menerima asal yang dikenal", () => {
    expect(originQuery({ dari: "persetujuan", tahap: "pic" })).toBe(
      "?dari=persetujuan&tahap=pic",
    );
    expect(originBack({ dari: "beranda", tanggal: "2026-10-27" })).toBe(
      "/?tanggal=2026-10-27",
    );
    expect(
      originBack({ dari: "monitoring", ruang: "3", tanggal: "2026-10-27" }),
    ).toBe("/monitoring/3?tanggal=2026-10-27");
  });

  it("menolak nilai yang tidak dikenal atau berbahaya", () => {
    expect(originQuery({ dari: "https://evil.example" })).toBe("");
    expect(originBack({ dari: "//evil.example" })).toBe("/booking");
    expect(originBack({ dari: "monitoring", ruang: "3/../../x" })).toBe(
      "/booking",
    );
    expect(originQuery({ dari: "beranda", tanggal: "<script>" })).toBe(
      "?dari=beranda",
    );
    expect(originQuery({ dari: "persetujuan", tahap: "admin" })).toBe(
      "?dari=persetujuan",
    );
  });
});
