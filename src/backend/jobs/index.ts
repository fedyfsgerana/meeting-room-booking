import "server-only";
import { env } from "@/backend/env";
import { APP_TIME_ZONE } from "@/lib/time";
import { QUEUES, getBoss } from "./boss";
import { completeBookings } from "./complete-bookings";
import { expireDrafts } from "./expire-drafts";

const globalForJobs = globalThis as unknown as { jobsStarted?: Promise<void> };

async function registerJobs() {
  const boss = await getBoss();

  await boss.schedule(QUEUES.expireDrafts, "* * * * *", null, {
    tz: APP_TIME_ZONE,
  });
  await boss.work(QUEUES.expireDrafts, async () => {
    const count = await expireDrafts();
    if (count) console.info(`[jobs] ${count} Draft batal otomatis`);
  });

  await boss.schedule(QUEUES.completeBookings, "* * * * *", null, {
    tz: APP_TIME_ZONE,
  });
  await boss.work(QUEUES.completeBookings, async () => {
    const count = await completeBookings();
    if (count) console.info(`[jobs] ${count} booking selesai otomatis`);
  });

  console.info("[jobs] Penjadwal aktif");
}

export function startJobs() {
  if (!env.JOBS_ENABLED) return;
  globalForJobs.jobsStarted ??= registerJobs().catch((error: unknown) => {
    globalForJobs.jobsStarted = undefined;
    console.error("[jobs] Penjadwal gagal dijalankan", error);
    throw error;
  });
  return globalForJobs.jobsStarted;
}
