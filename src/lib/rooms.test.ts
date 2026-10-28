import { describe, expect, it } from "vitest";
import { facilityLabel, roomInitial } from "./rooms";

describe("roomInitial", () => {
  it("mengambil dua huruf setelah kata Ruang", () => {
    expect(roomInitial("Ruang Apel")).toBe("Ap");
    expect(roomInitial("ruangan rapat")).toBe("Ra");
    expect(roomInitial("Aula")).toBe("Au");
  });
});

describe("facilityLabel", () => {
  it("menerjemahkan kunci fasilitas", () => {
    expect(facilityLabel("vc")).toBe("Teleconference");
    expect(facilityLabel("lainnya")).toBe("lainnya");
  });
});
