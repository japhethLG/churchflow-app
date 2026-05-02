import type { components } from "@/lib/api";

export type SummaryDto = components["schemas"]["TransactionSummaryResponseDto"];

export type ByTypeDto = components["schemas"]["TransactionSummaryByTypeDto"];
export type ByMonthDto = components["schemas"]["TransactionSummaryByMonthDto"];

export const TYPE_LABEL: Record<ByTypeDto["type"], string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

export const TYPE_COLOR: Record<ByTypeDto["type"], string> = {
	TITHE: "var(--tx-tithe)",
	OFFERING: "var(--tx-offering)",
	MISSION_GIVING: "var(--tx-mission)",
	FIRST_FRUIT: "var(--tx-first-fruit)",
	COMMITMENT: "var(--tx-commitment)",
	DONATION: "var(--tx-donation)",
	OTHER: "var(--tx-other)",
};

export const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export const MEMBER_RANK_COLORS = [
	"var(--tx-tithe)",
	"var(--tx-offering)",
	"var(--tx-mission)",
	"var(--tx-first-fruit)",
	"var(--tx-commitment)",
	"var(--tx-donation)",
	"var(--info)",
	"var(--success)",
	"var(--warning)",
] as const;

export const CAMPAIGN_RANK_COLORS = [
	"var(--tx-tithe)",
	"var(--tx-mission)",
	"var(--tx-first-fruit)",
	"var(--tx-commitment)",
	"var(--tx-donation)",
	"var(--info)",
	"var(--success)",
	"var(--warning)",
] as const;
