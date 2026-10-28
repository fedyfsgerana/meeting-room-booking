"use client";

import { useState } from "react";
import {
  CalendarPlus,
  CheckCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";
import { PERMISSION_MENUS, type Permission } from "@/lib/permissions";

type MenuDef = (typeof PERMISSION_MENUS)[number];
type MenuKey = MenuDef["key"];

const SECTIONS: Array<{ label: string; menus: MenuKey[] }> = [
  { label: "Booking dan monitoring", menus: ["dashboard", "booking"] },
  { label: "Persetujuan", menus: ["approve_dept", "approve_room"] },
  { label: "Master", menus: ["rooms", "departments", "approvers", "pic", "users", "access"] },
  { label: "Pengaturan", menus: ["settings", "activity"] },
];

const ACTION_ICON: Record<string, LucideIcon> = {
  create: ACTION_STYLE.create.icon,
  update: ACTION_STYLE.update.icon,
  delete: ACTION_STYLE.delete.icon,
  "booking.create": CalendarPlus,
  "booking.update": ACTION_STYLE.reschedule.icon,
  "booking.delete": ACTION_STYLE.cancel.icon,
  "booking.manage": Users,
  "approve_dept.approve": ACTION_STYLE.approve.icon,
  "approve_dept.reject": ACTION_STYLE.reject.icon,
  "approve_room.approve": ACTION_STYLE.check.icon,
  "approve_room.reject": ACTION_STYLE.reject.icon,
  "users.reset_password": ACTION_STYLE.resetPassword.icon,
  "users.deactivate": ACTION_STYLE.deactivate.icon,
  "activity.restore": ACTION_STYLE.restore.icon,
};

const MENU_BY_KEY = new Map<MenuKey, MenuDef>(
  PERMISSION_MENUS.map((menu) => [menu.key, menu]),
);

function keyOf(menu: MenuDef, action: string) {
  return `${menu.key}.${action}` as Permission;
}

function menuKeys(menu: MenuDef) {
  return menu.actions.map((action) => keyOf(menu, action.key));
}

const ALL_KEYS = PERMISSION_MENUS.flatMap(menuKeys);

type PermissionMatrixProps = {
  defaultValues: Permission[];
  disabled?: boolean;
};

export function PermissionMatrix({
  defaultValues,
  disabled = false,
}: PermissionMatrixProps) {
  const [selected, setSelected] = useState(
    () => new Set<Permission>(defaultValues),
  );

  const update = (change: (next: Set<Permission>) => void) => {
    setSelected((current) => {
      const next = new Set(current);
      change(next);
      return next;
    });
  };

  const toggleMenu = (menu: MenuDef, open: boolean) =>
    update((next) => {
      if (open) next.add(keyOf(menu, "view"));
      else menuKeys(menu).forEach((key) => next.delete(key));
    });

  const toggleAction = (permission: Permission, checked: boolean) =>
    update((next) =>
      checked ? next.add(permission) : next.delete(permission),
    );

  const setAll = (checked: boolean) =>
    update((next) =>
      ALL_KEYS.forEach((key) => (checked ? next.add(key) : next.delete(key))),
    );

  const count = ALL_KEYS.filter((key) => selected.has(key)).length;

  return (
    <div className="perm-list">
      {!disabled && (
        <div className="perm-toolbar">
          <span>
            {count} dari {ALL_KEYS.length} aksi dipilih
          </span>
          <button
            type="button"
            className="link-icon"
            onClick={() => setAll(true)}
            disabled={count === ALL_KEYS.length}
          >
            <CheckCheck aria-hidden="true" />
            Pilih semua
          </button>
          <button
            type="button"
            className="link-icon"
            onClick={() => setAll(false)}
            disabled={count === 0}
          >
            <X aria-hidden="true" />
            Kosongkan
          </button>
        </div>
      )}

      {SECTIONS.map((section) => (
        <section key={section.label} className="perm-section">
          <h3>{section.label}</h3>
          {section.menus.map((menuKey) => {
            const menu = MENU_BY_KEY.get(menuKey)!;
            const view = keyOf(menu, "view");
            const open = selected.has(view);
            const actions = menu.actions.filter(
              (action) => action.key !== "view",
            );
            return (
              <div
                key={menu.key}
                className="perm-row"
                data-open={open || undefined}
              >
                <label
                  className="perm-switch"
                  title={
                    open
                      ? `Tutup menu ${menu.label}`
                      : `Buka menu ${menu.label}`
                  }
                >
                  <input
                    type="checkbox"
                    role="switch"
                    name="permissions"
                    value={view}
                    checked={open}
                    disabled={disabled}
                    onChange={(event) => toggleMenu(menu, event.target.checked)}
                  />
                  <span aria-hidden="true" />
                </label>
                <div className="perm-name">
                  <b>{menu.label}</b>
                  <small>{menu.description}</small>
                </div>
                <div className="perm-chips">
                  {!open ? (
                    <span className="perm-off">
                      Tidak bisa membuka menu ini
                    </span>
                  ) : actions.length ? (
                    actions.map((action) => {
                      const permission = keyOf(menu, action.key);
                      const Icon =
                        ACTION_ICON[permission] ?? ACTION_ICON[action.key];
                      return (
                        <label
                          key={permission}
                          className="perm-chip"
                          data-on={selected.has(permission) || undefined}
                        >
                          <input
                            type="checkbox"
                            name="permissions"
                            value={permission}
                            checked={selected.has(permission)}
                            disabled={disabled}
                            onChange={(event) =>
                              toggleAction(permission, event.target.checked)
                            }
                          />
                          {Icon && <Icon aria-hidden="true" />}
                          {action.label}
                        </label>
                      );
                    })
                  ) : (
                    <span className="perm-off">Hanya melihat</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
