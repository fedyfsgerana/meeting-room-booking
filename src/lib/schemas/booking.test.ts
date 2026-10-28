import { describe, expect, it } from "vitest";
import { bookingSchema, slotSchema, type BookingInput } from "./booking";

const valid: BookingInput = {
  roomId: "1",
  date: "2026-11-02",
  startMinute: "09:00",
  endMinute: "10:30",
  topic: "Rapat koordinasi",
  departmentId: "3",
  approverId: "5",
  participants: "",
  teleconference: false,
  teleApp: "",
  notes: "",
};

function errorPaths(input: BookingInput) {
  const result = bookingSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path[0]);
}

describe("bookingSchema", () => {
  it("menerima booking yang benar dan merapikan nilainya", () => {
    const result = bookingSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      roomId: 1,
      startMinute: 540,
      endMinute: 630,
      participants: null,
      notes: null,
      teleApp: null,
    });
  });

  it("menolak jam selesai yang tidak setelah jam mulai", () => {
    expect(errorPaths({ ...valid, endMinute: "09:00" })).toContain("endMinute");
  });

  it("mewajibkan aplikasi saat teleconference dipilih", () => {
    expect(errorPaths({ ...valid, teleconference: true })).toContain("teleApp");
    expect(
      errorPaths({
        ...valid,
        teleconference: true,
        teleApp: "Zoom",
        host: "yes",
      }),
    ).toEqual([]);
    expect(
      errorPaths({ ...valid, teleconference: true, teleApp: "Zoom" }),
    ).toContain("host");
    expect(
      errorPaths({
        ...valid,
        teleconference: true,
        teleApp: "Telegram",
        host: "no",
      }),
    ).toContain("teleApp");
  });

  it("membatasi jumlah peserta 1 sampai 500", () => {
    expect(errorPaths({ ...valid, participants: "0" })).toContain(
      "participants",
    );
    expect(errorPaths({ ...valid, participants: "501" })).toContain(
      "participants",
    );
    expect(errorPaths({ ...valid, participants: "12" })).toEqual([]);
  });

  it("mewajibkan penyetuju yang menyetujui", () => {
    expect(errorPaths({ ...valid, approverId: "" })).toContain("approverId");
  });

  it("mewajibkan topik minimal 3 karakter", () => {
    expect(errorPaths({ ...valid, topic: "  ab " })).toContain("topic");
  });

  it("menolak tanggal dan jam yang tidak valid", () => {
    expect(errorPaths({ ...valid, date: "02-11-2026" })).toContain("date");
    expect(errorPaths({ ...valid, startMinute: "" })).toContain("startMinute");
  });
});

describe("slotSchema", () => {
  it("menolak slot yang belum lengkap", () => {
    expect(
      slotSchema.safeParse({
        roomId: "",
        date: "2026-11-02",
        startMinute: "09:00",
        endMinute: "10:00",
      }).success,
    ).toBe(false);
    expect(
      slotSchema.safeParse({
        roomId: "2",
        date: "2026-11-02",
        startMinute: "09:00",
        endMinute: "10:00",
      }).success,
    ).toBe(true);
  });
});
