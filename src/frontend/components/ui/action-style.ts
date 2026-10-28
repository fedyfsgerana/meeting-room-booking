import {
  Ban,
  CalendarClock,
  CalendarPlus,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ButtonVariant } from "./button";
import type { IconButtonTone } from "./icon-button";
import type { ModalTone } from "./modal";

export type ActionStyle = {
  icon: LucideIcon;
  tone: IconButtonTone;
  modal: ModalTone;
  button: ButtonVariant;
};

function style(
  icon: LucideIcon,
  tone: IconButtonTone,
  modal: ModalTone,
): ActionStyle {
  const button: ButtonVariant =
    modal === "danger"
      ? "danger"
      : modal === "success"
        ? "success"
        : modal === "warn"
          ? "warn"
          : "primary";
  return { icon, tone, modal, button };
}

export const ACTION_STYLE = {
  view: style(Eye, "default", "primary"),
  create: style(Plus, "info", "primary"),
  save: style(Save, "info", "primary"),
  book: style(CalendarPlus, "info", "primary"),
  update: style(Pencil, "info", "primary"),
  delete: style(Trash2, "bad", "danger"),
  restore: style(RotateCcw, "warn", "warn"),
  reschedule: style(CalendarClock, "warn", "warn"),
  cancel: style(CircleX, "bad", "danger"),
  approve: style(CircleCheck, "ok", "success"),
  check: style(ClipboardCheck, "ok", "success"),
  reject: style(X, "bad", "danger"),
  resetPassword: style(KeyRound, "warn", "warn"),
  activate: style(CircleCheck, "ok", "success"),
  deactivate: style(Ban, "bad", "danger"),
  sync: style(RefreshCw, "info", "primary"),
} satisfies Record<string, ActionStyle>;

export type ActionKey = keyof typeof ACTION_STYLE;
