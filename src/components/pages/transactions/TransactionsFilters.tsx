"use client";

import { Chip, Input } from "@/components/primitives";
import dayjs from "@/lib/dayjs";
import type { components } from "@/lib/api";

type TransactionType = components["schemas"]["TransactionResponseDto"]["type"];
type Campaign = components["schemas"]["CampaignResponseDto"];

export type TransactionTypeFilter = "all" | TransactionType;

export type DateRangeFilter =
  | "all"
  | "today"
  | "this-month"
  | "last-month"
  | "ytd";

export type TransactionsFiltersValue = {
  search: string;
  type: TransactionTypeFilter;
  range: DateRangeFilter;
  campaignId: string | "all";
};

const TYPE_LABEL: Record<TransactionTypeFilter, string> = {
  all: "All types",
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

const RANGE_LABEL: Record<DateRangeFilter, string> = {
  all: "All time",
  today: "Today",
  "this-month": "This month",
  "last-month": "Last month",
  ytd: "Year to date",
};

const TYPE_CYCLE: TransactionTypeFilter[] = [
  "all",
  "TITHE",
  "OFFERING",
  "MISSION_GIVING",
  "FIRST_FRUIT",
  "COMMITMENT",
  "DONATION",
  "OTHER",
];
const RANGE_CYCLE: DateRangeFilter[] = ["all", "today", "this-month", "last-month", "ytd"];

const next = <T,>(arr: readonly T[], v: T): T => {
  const i = arr.indexOf(v);
  return arr[(i + 1) % arr.length];
}

export const TransactionsFilters = ({
  value,
  campaigns,
  onChange,
  onReset,
}: {
  value: TransactionsFiltersValue;
  campaigns: Campaign[];
  onChange: (v: TransactionsFiltersValue) => void;
  onReset: () => void;
}) => {
  const campaignLabel =
    value.campaignId === "all"
      ? "All campaigns"
      : campaigns.find((c) => c.id === value.campaignId)?.title ?? "Campaign";

  const cycleCampaign = () => {
    const ids: (string | "all")[] = ["all", ...campaigns.map((c) => c.id)];
    onChange({ ...value, campaignId: next(ids, value.campaignId) });
  }

  const isFiltered =
    value.search.trim().length > 0 ||
    value.type !== "all" ||
    value.range !== "all" ||
    value.campaignId !== "all";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-muted p-3">
      <div className="min-w-[200px] max-w-[320px] flex-1">
        <Input
          icon="search"
          placeholder="Search note or reference #…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <span onClick={() => onChange({ ...value, range: next(RANGE_CYCLE, value.range) })}>
        <Chip icon="calendar" active={value.range !== "all"}>
          {RANGE_LABEL[value.range]}
        </Chip>
      </span>
      <span onClick={() => onChange({ ...value, type: next(TYPE_CYCLE, value.type) })}>
        <Chip icon="chevronDown" active={value.type !== "all"}>
          {TYPE_LABEL[value.type]}
        </Chip>
      </span>
      <span onClick={cycleCampaign}>
        <Chip icon="chevronDown" active={value.campaignId !== "all"}>
          {campaignLabel}
        </Chip>
      </span>
      {isFiltered && (
        <span
          onClick={onReset}
          className="ml-auto cursor-pointer px-2 text-xs text-muted-foreground"
        >
          Reset filters
        </span>
      )}
    </div>
  );
}

// Resolve a `DateRangeFilter` to ISO strings the backend accepts.
export const resolveRange = (range: DateRangeFilter): { dateFrom?: string; dateTo?: string } => {
  const now = dayjs();

  switch (range) {
    case "today": {
      return { dateFrom: now.startOf("day").toISOString() };
    }
    case "this-month": {
      return { dateFrom: now.startOf("month").toISOString() };
    }
    case "last-month": {
      const start = now.subtract(1, "month").startOf("month");
      const end = now.startOf("month");
      return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
    }
    case "ytd": {
      return { dateFrom: now.startOf("year").toISOString() };
    }
    default:
      return {};
  }
}
