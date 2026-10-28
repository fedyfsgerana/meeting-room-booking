import { describe, expect, it } from "vitest";
import { isBoolean, isId, isText } from "./args";

describe("argumen Server Action", () => {
  it("hanya menerima ID bilangan bulat positif", () => {
    expect(isId(12)).toBe(true);
    expect(isId(0)).toBe(false);
    expect(isId(-3)).toBe(false);
    expect(isId(1.5)).toBe(false);
    expect(isId("12")).toBe(false);
    expect(isId(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isId(null)).toBe(false);
  });

  it("hanya menerima boolean asli", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean("false")).toBe(false);
    expect(isBoolean(0)).toBe(false);
  });

  it("membatasi panjang teks", () => {
    expect(isText("cari")).toBe(true);
    expect(isText("x".repeat(101), 100)).toBe(false);
    expect(isText({ toString: () => "cari" })).toBe(false);
  });
});
