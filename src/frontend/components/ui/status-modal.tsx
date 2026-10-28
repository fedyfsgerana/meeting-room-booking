"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, CircleAlert, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Button, type ButtonVariant } from "@/frontend/components/ui/button";

export type StatusTone = "success" | "error" | "warning" | "info";

type StatusAction = { label: string; icon?: LucideIcon; href?: string; onClick?: () => void };

type StatusOptions = { title?: string; action?: StatusAction };

type StatusItem = StatusOptions & { id: number; message: string; tone: StatusTone };

type Notify = (message: string, tone?: StatusTone, options?: StatusOptions) => void;

const TONES: Record<StatusTone, { title: string; icon: LucideIcon; button: ButtonVariant; confirm: string }> = {
  success: { title: "Berhasil", icon: Check, button: "success", confirm: "Oke" },
  error: { title: "Gagal", icon: X, button: "danger", confirm: "Tutup" },
  warning: { title: "Perhatian", icon: TriangleAlert, button: "warn", confirm: "Mengerti" },
  info: { title: "Informasi", icon: Info, button: "primary", confirm: "Mengerti" },
};

const StatusContext = createContext<Notify>(() => {});

let nextId = 1;

function StatusModal({ item, onClose }: { item: StatusItem; onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const tone = TONES[item.tone];
  const Icon = item.tone === "error" ? CircleAlert : tone.icon;

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const runAction = () => {
    const action = item.action;
    onClose();
    if (!action) return;
    action.onClick?.();
    if (action.href) router.push(action.href);
  };

  return createPortal(
    <div
      className="backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="status-modal" role="alertdialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialogRef}>
        <button type="button" className="status-close" aria-label="Tutup" title="Tutup" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        <span className={`status-ic ${item.tone}`}>
          <Icon aria-hidden="true" />
        </span>
        <h2 id={titleId}>{item.title ?? tone.title}</h2>
        <p>{item.message}</p>
        <div className="status-actions">
          {item.action && (
            <Button icon={item.action.icon} onClick={runAction}>
              {item.action.label}
            </Button>
          )}
          <Button variant={tone.button} icon={item.tone === "error" ? X : Check} onClick={onClose}>
            {tone.confirm}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StatusProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<StatusItem | null>(null);

  const notify = useCallback<Notify>((message, tone = "success", options = {}) => {
    setItem({ id: nextId++, message, tone, ...options });
  }, []);

  const close = useCallback(() => setItem(null), []);

  return (
    <StatusContext value={notify}>
      {children}
      {item && <StatusModal key={item.id} item={item} onClose={close} />}
    </StatusContext>
  );
}

export function useStatus() {
  return useContext(StatusContext);
}
