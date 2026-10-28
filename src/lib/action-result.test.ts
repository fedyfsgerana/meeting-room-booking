import { describe, expect, it } from "vitest";
import { fieldErrorsFrom } from "./action-result";

describe("fieldErrorsFrom", () => {
  it("mengambil pesan pertama per kolom", () => {
    expect(
      fieldErrorsFrom([
        { path: ["name"], message: "Pertama" },
        { path: ["name"], message: "Kedua" },
        { path: ["capacity"], message: "Kapasitas salah" },
        { path: [], message: "Tanpa kolom" },
      ]),
    ).toEqual({ name: "Pertama", capacity: "Kapasitas salah" });
  });
});
