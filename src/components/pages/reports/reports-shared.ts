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

export const fmtCompact = (value: number): string => {
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
};

export const fmtCurrency = (value: number): string =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
