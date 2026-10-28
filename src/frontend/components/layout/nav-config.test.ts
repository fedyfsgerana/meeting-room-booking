import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { isActive, isGroup, navFor, type NavItem } from "./nav-config";

function hrefs(items: NavItem[]) {
  return items.flatMap((item) =>
    isGroup(item) ? item.children.map((child) => child.href) : [item.href],
  );
}

describe("navFor", () => {
  it("pemesan hanya melihat Beranda, Booking, dan Monitoring", () => {
    expect(hrefs(navFor(["dashboard.view", "booking.view"]))).toEqual([
      "/",
      "/booking",
      "/monitoring",
    ]);
  });

  it("admin melihat semua menu termasuk 6 submenu Master dan 2 submenu Pengaturan", () => {
    const items = navFor(ALL_PERMISSIONS);
    const groups = items.filter(isGroup);
    expect(
      groups.find((group) => group.key === "master")?.children,
    ).toHaveLength(6);
    expect(
      groups.find((group) => group.key === "pengaturan")?.children,
    ).toHaveLength(2);
    expect(hrefs(items)).toContain("/pengaturan/riwayat-aktivitas");
    expect(hrefs(items)).toContain("/persetujuan");
  });

  it("menampilkan Riwayat aktivitas saja bila hanya punya hak itu", () => {
    expect(hrefs(navFor(["activity.view"]))).toEqual([
      "/pengaturan/riwayat-aktivitas",
    ]);
  });

  it("menyembunyikan submenu yang tidak diizinkan", () => {
    expect(hrefs(navFor(["users.view"]))).toEqual(["/master/pengguna"]);
  });

  it("menampilkan Persetujuan untuk Penanggung Jawab Ruang", () => {
    expect(hrefs(navFor(["approve_room.view"]))).toEqual(["/persetujuan"]);
  });
});

describe("isActive", () => {
  it("mencocokkan halaman turunan, kecuali Beranda", () => {
    expect(isActive("/booking/12", "/booking")).toBe(true);
    expect(isActive("/booking", "/booking")).toBe(true);
    expect(isActive("/bookingan", "/booking")).toBe(false);
    expect(isActive("/booking", "/")).toBe(false);
    expect(isActive("/", "/")).toBe(true);
  });
});
