// Shared helpers + tokens for the preview pages. Kept tiny on purpose —
// preview-specific styling lives in the page composites; this file is
// only for pure functions and small lookup tables.

import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";

export type TxType = components["schemas"]["TransactionResponseDto"]["type"];

export const TYPE_LABEL: Record<TxType, string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

export const TYPE_COLOR: Record<TxType, string> = {
	TITHE: "var(--tx-tithe)",
	OFFERING: "var(--tx-offering)",
	MISSION_GIVING: "var(--tx-mission)",
	FIRST_FRUIT: "var(--tx-first-fruit)",
	COMMITMENT: "var(--tx-commitment)",
	DONATION: "var(--tx-donation)",
	OTHER: "var(--tx-other)",
};

// Categorical palette for series without a semantic meaning (e.g. cycling
// through campaigns in a mix bar).
export const CATEGORICAL_PALETTE = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--tx-tithe)",
	"var(--tx-offering)",
	"var(--tx-mission)",
	"var(--tx-first-fruit)",
	"var(--tx-commitment)",
] as const;

export const pickCategorical = (i: number) =>
	CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length];

export type Delta = { value: string; dir: "up" | "down" | "flat" };

export const computeDelta = (current: number, previous: number): Delta => {
	if (!previous) {
		return { value: current > 0 ? "new" : "—", dir: "flat" };
	}
	const pct = ((current - previous) / previous) * 100;
	const dir = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
	const sign = pct > 0 ? "+" : "";
	return { value: `${sign}${pct.toFixed(1)}%`, dir };
};

// Backend serializes Prisma Decimal as JSON strings even though the
// OpenAPI schema types it as `number`. Coerce defensively whenever you
// do arithmetic on an `amount` / `pledgedAmount` / etc. field.
export const num = (v: number | string | null | undefined): number => {
	if (v == null) {
		return 0;
	}
	const n = typeof v === "string" ? Number(v) : v;
	return Number.isFinite(n) ? n : 0;
};

export const pct = (
	numerator: number | string,
	denominator: number | string,
) => {
	const n = num(numerator);
	const d = num(denominator);
	return d > 0 ? Math.round((n / d) * 100) : 0;
};

// Days until a deadline ISO string. Returns null when no deadline.
export const daysUntil = (
	deadline: string | null | undefined,
): number | null => {
	if (!deadline) {
		return null;
	}
	return dayjs(deadline).startOf("day").diff(dayjs().startOf("day"), "day");
};

// Resolve the deadline a pledge is operating against. Item deadline
// wins when present — items can carry an *advance* deadline relative to
// the campaign (e.g. a material that's needed before the campaign as a
// whole closes). Falls through to the campaign deadline when the pledge
// is unscoped or its item has no deadline of its own.
// Generator emits nullable strings as `Record<string, never> | null` —
// accept `unknown` on the wire-typed fields and normalize internally.
export const resolvePledgeDeadline = (
	pledge: { campaignItemId?: unknown },
	campaign: { deadline?: unknown } | undefined,
	itemDeadlinesById: Record<string, string | null | undefined>,
): string | null => {
	const itemId =
		typeof pledge.campaignItemId === "string" ? pledge.campaignItemId : null;
	if (itemId) {
		const itemDeadline = itemDeadlinesById[itemId];
		if (typeof itemDeadline === "string") {
			return itemDeadline;
		}
	}
	return typeof campaign?.deadline === "string" ? campaign.deadline : null;
};

// Lifecycle bucket for a single pledge given pledge fields + the
// resolved deadline (use `resolvePledgeDeadline` above). Pledges have no
// own dueDate — they inherit campaign-item deadline > campaign deadline.
export type PledgeLifecycle =
	| "fulfilled"
	| "on-track"
	| "due-soon"
	| "past-due"
	| "no-deadline"
	| "cancelled";

export const pledgeLifecycle = (
	pledged: number | string,
	paid: number | string,
	status: "ACTIVE" | "FULFILLED" | "CANCELLED",
	deadline: string | null | undefined,
): PledgeLifecycle => {
	if (status === "CANCELLED") {
		return "cancelled";
	}
	const pl = num(pledged);
	const pd = num(paid);
	if (status === "FULFILLED" || pd >= pl) {
		return "fulfilled";
	}
	const days = daysUntil(deadline ?? null);
	if (days === null) {
		return "no-deadline";
	}
	if (days < 0) {
		return "past-due";
	}
	if (days <= 14) {
		return "due-soon";
	}
	return "on-track";
};

export const LIFECYCLE_LABEL: Record<PledgeLifecycle, string> = {
	fulfilled: "Fulfilled",
	"on-track": "On track",
	"due-soon": "Due soon",
	"past-due": "Past due",
	"no-deadline": "No deadline",
	cancelled: "Cancelled",
};

export const LIFECYCLE_COLOR: Record<PledgeLifecycle, string> = {
	fulfilled: "var(--chart-positive)",
	"on-track": "var(--chart-current)",
	"due-soon": "var(--chart-goal)",
	"past-due": "var(--chart-negative)",
	"no-deadline": "var(--chart-prior)",
	cancelled: "var(--muted-foreground)",
};

// Visit each item; drop those below `minFraction` of total and bucket
// them into a single "Other" segment.
export const bucketSmallSegments = <T extends { value: number }>(
	items: T[],
	minFraction: number,
	makeOther: (totalDropped: number) => T,
): T[] => {
	const sum = items.reduce((s, x) => s + Math.max(0, x.value), 0);
	if (sum === 0) {
		return items;
	}
	const threshold = sum * minFraction;
	const kept: T[] = [];
	let dropped = 0;
	for (const it of items) {
		if (it.value < threshold) {
			dropped += it.value;
		} else {
			kept.push(it);
		}
	}
	if (dropped > 0) {
		kept.push(makeOther(dropped));
	}
	return kept;
};
