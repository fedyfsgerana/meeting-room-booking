"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  ClipboardCheck,
  ListChecks,
} from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/backend/notifications/actions";
import { cx } from "@/lib/cx";
import { formatRelative } from "@/lib/format";

type FeedItem = {
  id: number;
  kind: "approval_dept" | "approval_room";
  title: string;
  body: string;
  href: string;
  readAt: Date | string | null;
  createdAt: Date | string;
};

export type Feed = { unread: number; items: FeedItem[] };

const POLL_MS = 60_000;

export function NotificationBell({ initial }: { initial: Feed }) {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed>(initial);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifikasi", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/sesi-berakhir");
        return;
      }
      if (!response.ok) return;
      setFeed((await response.json()) as Feed);
      setNow(new Date());
    } catch {
      return;
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(refresh, POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setNow(new Date());
      void refresh();
    }
    setOpen(!open);
  };

  const openItem = (item: FeedItem) => {
    setOpen(false);
    if (!item.readAt) {
      setFeed((current) => ({
        unread: Math.max(0, current.unread - 1),
        items: current.items.map((entry) =>
          entry.id === item.id ? { ...entry, readAt: new Date() } : entry,
        ),
      }));
      void markNotificationReadAction(item.id);
    }
    router.push(item.href);
  };

  const readAll = () => {
    setFeed((current) => ({
      unread: 0,
      items: current.items.map((entry) => ({
        ...entry,
        readAt: entry.readAt ?? new Date(),
      })),
    }));
    void markAllNotificationsReadAction();
  };

  const badge = feed.unread > 99 ? "99+" : String(feed.unread);

  return (
    <div className="notif" ref={rootRef}>
      <button
        type="button"
        className="notif-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          feed.unread ? `Notifikasi, ${feed.unread} belum dibaca` : "Notifikasi"
        }
        title="Notifikasi"
        onClick={toggle}
      >
        <Bell aria-hidden="true" />
        {feed.unread > 0 && <span className="notif-count">{badge}</span>}
      </button>
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifikasi">
          <div className="notif-head">
            <b>Notifikasi</b>
            {feed.unread > 0 && (
              <button type="button" className="link-icon" onClick={readAll}>
                <CheckCheck aria-hidden="true" />
                Tandai semua dibaca
              </button>
            )}
          </div>
          {feed.items.length ? (
            <ul className="notif-list">
              {feed.items.map((item) => {
                const Icon =
                  item.kind === "approval_room" ? ListChecks : ClipboardCheck;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cx("notif-item", !item.readAt && "unread")}
                      onClick={() => openItem(item)}
                    >
                      <span className="notif-ic">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="notif-text">
                        <b>{item.title}</b>
                        <span>{item.body}</span>
                        {now && (
                          <small>{formatRelative(item.createdAt, now)}</small>
                        )}
                      </span>
                      {!item.readAt && (
                        <i className="notif-dot" aria-label="Belum dibaca" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="notif-empty">
              <BellOff aria-hidden="true" />
              Belum ada notifikasi.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationPlaceholder() {
  return <span className="sk sk-bell" aria-hidden="true" />;
}
