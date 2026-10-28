"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

function remaining(expiresAt: Date, now: number) {
  const minutes = Math.floor((expiresAt.getTime() - now) / 60_000);
  if (minutes <= 0) return "menunggu batal otomatis";
  const hours = Math.floor(minutes / 60);
  return `sisa ${hours ? `${hours} jam ` : ""}${minutes % 60} menit`;
}

export function DraftCountdown({ expiresAt }: { expiresAt: Date | string }) {
  const deadline =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="draft-left">
      <span className="cell-sub nowrap">s/d {formatDateTime(deadline)}</span>
      {now !== null && (
        <span className="draft-remaining nowrap">
          {remaining(deadline, now)}
        </span>
      )}
    </div>
  );
}
