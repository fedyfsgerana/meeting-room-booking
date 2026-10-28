import "server-only";
import { PgBoss } from "pg-boss";
import { env } from "@/backend/env";

export const QUEUES = {
  expireDrafts: "expire-drafts",
  completeBookings: "complete-bookings",
} as const;

const globalForBoss = globalThis as unknown as { pgBoss?: Promise<PgBoss> };

async function createBoss() {
  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: "pgboss",
  });
  boss.on("error", (error) => console.error("[jobs]", error));
  await boss.start();
  for (const queue of Object.values(QUEUES)) await boss.createQueue(queue);
  process.once("SIGTERM", () => void boss.stop());
  process.once("SIGINT", () => void boss.stop());
  return boss;
}

export function getBoss() {
  globalForBoss.pgBoss ??= createBoss().catch((error: unknown) => {
    globalForBoss.pgBoss = undefined;
    throw error;
  });
  return globalForBoss.pgBoss;
}
