"use client";

import { useSyncExternalStore } from "react";
import { RetryButton } from "./error-actions";
import { ErrorScreen } from "./error-screen";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineScreen() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  if (online) return null;
  return <ErrorScreen type="offline" overlay actions={<RetryButton />} />;
}
