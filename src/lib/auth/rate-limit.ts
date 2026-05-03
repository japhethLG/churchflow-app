import "server-only";

// Token-bucket rate limiter for the POST /api/auth/session route.
// verifyIdToken is RSA-bound and CPU-expensive — without a limit, an
// attacker can pin a Node worker by spamming the endpoint with garbage
// tokens. This buys time until proper edge rate limiting (Vercel KV /
// Upstash / Cloudflare) is wired up.
//
// Limitation: in-memory means each Node instance has its own bucket.
// Behind multiple replicas the effective rate is `RATE * replicas`.
// Adequate for single-instance deployments and dev. Replace with a
// shared store before horizontally scaling auth traffic.

type Bucket = { tokens: number; lastRefill: number };

const RATE_PER_MINUTE = 20; // 20 requests per minute per key
const REFILL_PER_MS = RATE_PER_MINUTE / 60_000;
const BUCKET_CAPACITY = RATE_PER_MINUTE;
const SWEEP_INTERVAL_MS = 5 * 60_000;
const STALE_AFTER_MS = 10 * 60_000;

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

const sweepStaleBuckets = (now: number) => {
	if (now - lastSweep < SWEEP_INTERVAL_MS) {
		return;
	}
	lastSweep = now;
	for (const [key, b] of buckets) {
		if (now - b.lastRefill > STALE_AFTER_MS) {
			buckets.delete(key);
		}
	}
};

export type RateLimitResult = {
	allowed: boolean;
	retryAfterSeconds: number;
};

export const checkRateLimit = (key: string): RateLimitResult => {
	const now = Date.now();
	sweepStaleBuckets(now);

	let b = buckets.get(key);
	if (!b) {
		b = { tokens: BUCKET_CAPACITY, lastRefill: now };
		buckets.set(key, b);
	} else {
		const elapsed = now - b.lastRefill;
		b.tokens = Math.min(BUCKET_CAPACITY, b.tokens + elapsed * REFILL_PER_MS);
		b.lastRefill = now;
	}

	if (b.tokens >= 1) {
		b.tokens -= 1;
		return { allowed: true, retryAfterSeconds: 0 };
	}

	const tokensNeeded = 1 - b.tokens;
	const retryAfterSeconds = Math.ceil(tokensNeeded / REFILL_PER_MS / 1000);
	return { allowed: false, retryAfterSeconds };
};

// Best-effort caller identification. X-Forwarded-For is set by Vercel,
// Cloudflare, and any sane proxy; falls back to a constant so behind a
// stripped header the limiter still applies (just globally).
export const getRateLimitKey = (req: Request): string => {
	const xff = req.headers.get("x-forwarded-for");
	if (xff) {
		return (xff.split(",")[0] ?? xff).trim();
	}
	const realIp = req.headers.get("x-real-ip");
	if (realIp) {
		return realIp.trim();
	}
	return "global";
};
