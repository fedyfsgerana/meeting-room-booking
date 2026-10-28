import { describe, expect, it } from "vitest";
import { passwordProblem } from "./password-policy";

const identity = { name: "Dewi Lestari", email: "dewi.lestari@example.com" };

describe("passwordProblem", () => {
  it("menerima password yang kuat", () => {
    expect(passwordProblem("Senja2026Biru", identity)).toBeNull();
  });

  it("mewajibkan huruf dan angka", () => {
    expect(passwordProblem("hanyahuruf", identity)).toMatch(/huruf dan angka/);
    expect(passwordProblem("1234567899", identity)).toMatch(/huruf dan angka/);
  });

  it("menolak password umum", () => {
    expect(passwordProblem("P@ssw0rd")).toMatch(/terlalu umum/);
    expect(passwordProblem("booking123")).toMatch(/terlalu umum/);
  });

  it("menolak password yang memuat nama atau email", () => {
    expect(passwordProblem("dewi.lestari99", identity)).toMatch(/nama atau email/);
    expect(passwordProblem("Lestari2026", identity)).toMatch(/nama atau email/);
  });
});
