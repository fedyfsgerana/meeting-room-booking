import {
  Building2,
  CalendarPlus,
  ClipboardCheck,
  DoorOpen,
  History,
  House,
  ListChecks,
  type LucideIcon,
  Monitor,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  UserCheck,
  Users,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type NavLink = {
  href: string;
  label: string;
  short?: string;
  icon: LucideIcon;
  permissions: Permission[];
};

export type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  children: NavLink[];
};

export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Beranda",
    short: "Beranda",
    icon: House,
    permissions: ["dashboard.view"],
  },
  {
    key: "master",
    label: "Master",
    icon: Table2,
    children: [
      {
        href: "/master/ruangan",
        label: "Ruangan",
        icon: DoorOpen,
        permissions: ["rooms.view"],
      },
      {
        href: "/master/departemen",
        label: "Departemen",
        icon: Building2,
        permissions: ["departments.view"],
      },
      {
        href: "/master/penyetuju",
        label: "Penyetuju",
        icon: UserCheck,
        permissions: ["approvers.view"],
      },
      {
        href: "/master/penanggung-jawab-ruang",
        label: "Penanggung Jawab Ruang",
        icon: ListChecks,
        permissions: ["pic.view"],
      },
      {
        href: "/master/pengguna",
        label: "Pengguna",
        icon: Users,
        permissions: ["users.view"],
      },
      {
        href: "/master/hak-akses",
        label: "Hak akses",
        icon: ShieldCheck,
        permissions: ["access.view"],
      },
    ],
  },
  {
    href: "/booking",
    label: "Booking Ruang",
    short: "Booking",
    icon: CalendarPlus,
    permissions: ["booking.view"],
  },
  {
    href: "/persetujuan",
    label: "Persetujuan",
    short: "Persetujuan",
    icon: ClipboardCheck,
    permissions: ["approve_dept.view", "approve_room.view"],
  },
  {
    href: "/monitoring",
    label: "Monitoring",
    short: "Monitoring",
    icon: Monitor,
    permissions: ["dashboard.view"],
  },
  {
    key: "pengaturan",
    label: "Pengaturan",
    icon: Settings,
    children: [
      {
        href: "/pengaturan/aturan-booking",
        label: "Aturan booking",
        icon: SlidersHorizontal,
        permissions: ["settings.view"],
      },
      {
        href: "/pengaturan/riwayat-aktivitas",
        label: "Riwayat aktivitas",
        icon: History,
        permissions: ["activity.view"],
      },
    ],
  },
];

export const MOBILE_MAIN = ["/", "/booking", "/persetujuan", "/monitoring"];

export function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function allowed(link: NavLink, permissions: Permission[]) {
  return link.permissions.some((permission) =>
    permissions.includes(permission),
  );
}

export function navFor(permissions: Permission[]): NavItem[] {
  return NAV_ITEMS.flatMap((item): NavItem[] => {
    if (!isGroup(item)) return allowed(item, permissions) ? [item] : [];
    const children = item.children.filter((child) =>
      allowed(child, permissions),
    );
    return children.length ? [{ ...item, children }] : [];
  });
}
