"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cx } from "@/lib/cx";

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={cx("scroll-top", visible && "show")}
      onClick={scrollTop}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <ArrowUp aria-hidden="true" />
    </button>
  );
}
