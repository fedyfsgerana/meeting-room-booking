"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "done";

function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return null;
  const anchor = (event.target as Element | null)?.closest("a");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download"))
    return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  )
    return null;
  return url;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const hideTimer = useRef<number | undefined>(undefined);
  const firstRender = useRef(true);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isInternalNavigation(event)) return;
      window.clearTimeout(hideTimer.current);
      setPhase("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const finish = window.setTimeout(() => setPhase("done"), 0);
    hideTimer.current = window.setTimeout(() => setPhase("idle"), 400);
    return () => {
      window.clearTimeout(finish);
      window.clearTimeout(hideTimer.current);
    };
  }, [pathname, searchParams]);

  return (
    <div
      className="nav-progress"
      data-phase={phase}
      role="progressbar"
      aria-hidden={phase === "idle"}
      aria-label="Memuat halaman"
    />
  );
}
