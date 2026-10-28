import "server-only";

type Rule = { limit: number; windowMs: number };

export const RATE_LIMITS = {
  login: { limit: 20, windowMs: 60_000 },
  availability: { limit: 60, windowMs: 60_000 },
  notifications: { limit: 30, windowMs: 60_000 },
  restore: { limit: 20, windowMs: 60_000 },
} satisfies Record<string, Rule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

const globalForLimit = globalThis as unknown as {
  rateBuckets?: Map<string, number[]>;
  rateSweepAt?: number;
};
const buckets = (globalForLimit.rateBuckets ??= new Map<string, number[]>());

function sweep(now: number) {
  if ((globalForLimit.rateSweepAt ?? 0) > now - 60_000) return;
  globalForLimit.rateSweepAt = now;
  const longest = Math.max(
    ...Object.values(RATE_LIMITS).map((rule) => rule.windowMs),
  );
  for (const [key, hits] of buckets) {
    if (!hits.length || hits[hits.length - 1] < now - longest)
      buckets.delete(key);
  }
}

export function takeRateLimit(
  name: RateLimitName,
  subject: string | number | null | undefined,
) {
  const rule = RATE_LIMITS[name];
  const now = Date.now();
  sweep(now);
  const key = `${name}:${subject ?? "anonim"}`;
  const hits = (buckets.get(key) ?? []).filter(
    (time) => time > now - rule.windowMs,
  );
  if (hits.length >= rule.limit) {
    buckets.set(key, hits);
    return {
      allowed: false as const,
      retrySeconds: Math.max(
        1,
        Math.ceil((hits[0] + rule.windowMs - now) / 1000),
      ),
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true as const };
}
